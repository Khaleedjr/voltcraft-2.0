import "server-only";
import { randomUUID } from "node:crypto";
import { BUNDLED_PRODUCTS, PRODUCT_COLUMNS, type ProductRow } from "@/lib/catalogue-data";
import type { CategorySlug, Spec, Variant } from "@/lib/catalogue";
import { cleanSearch, likePattern } from "@/lib/admin/search";
import { db } from "@/lib/supabase";

/**
 * The admin's view of products: every status, every field, straight from the
 * database with no cache — the counter must always see the truth.
 */

export type ProductStatus = "active" | "draft" | "archived";
export type StockState = "in" | "low" | "out" | "untracked";

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  status: ProductStatus;
  categories: CategorySlug[];
  summary: string;
  description: string[];
  price: number;
  compareAt: number | null;
  stock: number | null;
  inStock: boolean;
  lowStockAt: number;
  stockState: StockState;
  specs: Spec[];
  tags: string[];
  images: string[];
  variants: Variant[];
  featured: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

type AdminRow = ProductRow & { stock_state: StockState };

const COLUMNS = `${PRODUCT_COLUMNS},stock_state`;

function toAdmin(row: AdminRow): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    status: row.status,
    categories: row.categories as CategorySlug[],
    summary: row.summary,
    description: row.description,
    price: row.price,
    compareAt: row.compare_at,
    stock: row.stock,
    inStock: row.in_stock,
    lowStockAt: row.low_stock_at,
    stockState: row.stock_state,
    specs: row.specs ?? [],
    tags: row.tags,
    images: row.images,
    variants: row.variants ?? [],
    featured: row.featured,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------- list

export const PRODUCT_SORTS = {
  updated: { label: "Recently edited", column: "updated_at", ascending: false },
  name: { label: "Name A–Z", column: "name", ascending: true },
  "price-desc": { label: "Price, high to low", column: "price", ascending: false },
  "price-asc": { label: "Price, low to high", column: "price", ascending: true },
  "stock-asc": { label: "Stock, lowest first", column: "stock", ascending: true },
} as const;
export type ProductSort = keyof typeof PRODUCT_SORTS;

export type ProductListParams = {
  q?: string;
  view?: "all" | "active" | "draft" | "archived" | "low" | "out";
  category?: string;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
};

export type ProductListCounts = Record<"all" | "active" | "draft" | "archived" | "low" | "out", number>;

export async function listProducts(params: ProductListParams): Promise<{
  rows: AdminProduct[];
  total: number;
  page: number;
  pageCount: number;
  counts: ProductListCounts;
}> {
  const perPage = params.perPage ?? 25;
  const view = params.view ?? "all";
  const q = cleanSearch(params.q);
  const sort = PRODUCT_SORTS[params.sort ?? "updated"] ?? PRODUCT_SORTS.updated;

  let query = db().from("products").select(COLUMNS, { count: "exact" });
  if (view === "all") query = query.neq("status", "archived");
  else if (view === "low" || view === "out") query = query.neq("status", "archived").eq("stock_state", view);
  else query = query.eq("status", view);
  if (params.category) query = query.contains("categories", [params.category]);
  if (q) {
    const like = likePattern(q);
    query = query.or(`name.ilike.${like},sku.ilike.${like},slug.ilike.${like}`);
  }
  query = query.order(sort.column, { ascending: sort.ascending, nullsFirst: false }).order("name");

  const base = () => db().from("products").select("id", { count: "exact", head: true });
  const count = (build: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => build(base());

  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * perPage;
  const [list, all, active, draft, archived, low, out] = await Promise.all([
    query.range(from, from + perPage - 1).overrideTypes<AdminRow[], { merge: false }>(),
    count((b) => b.neq("status", "archived")),
    count((b) => b.eq("status", "active")),
    count((b) => b.eq("status", "draft")),
    count((b) => b.eq("status", "archived")),
    count((b) => b.neq("status", "archived").eq("stock_state", "low")),
    count((b) => b.neq("status", "archived").eq("stock_state", "out")),
  ]);
  for (const r of [list, all, active, draft, archived, low, out]) {
    if (r.error) throw new Error(`could not list products: ${r.error.message}`);
  }

  const total = list.count ?? 0;
  return {
    rows: (list.data ?? []).map(toAdmin),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    counts: {
      all: all.count ?? 0,
      active: active.count ?? 0,
      draft: draft.count ?? 0,
      archived: archived.count ?? 0,
      low: low.count ?? 0,
      out: out.count ?? 0,
    },
  };
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db().from("products").select(COLUMNS).eq("id", id).maybeSingle<AdminRow>();
  if (error) throw new Error(`could not read product: ${error.message}`);
  return data ? toAdmin(data) : null;
}

/** Everything that is counted, for pickers (receive a delivery, adjust stock). */
export async function listCountedProducts(): Promise<Pick<AdminProduct, "id" | "name" | "sku" | "stock" | "stockState">[]> {
  const { data, error } = await db()
    .from("products")
    .select("id,name,sku,stock,stock_state")
    .not("stock", "is", null)
    .neq("status", "archived")
    .order("name")
    .limit(1000);
  if (error) throw new Error(`could not list counted products: ${error.message}`);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, sku: r.sku, stock: r.stock, stockState: r.stock_state }));
}

/** The lines that need restocking, most urgent first. */
export async function listStockAlerts(limit = 50): Promise<AdminProduct[]> {
  const { data, error } = await db()
    .from("products")
    .select(COLUMNS)
    .neq("status", "archived")
    .in("stock_state", ["out", "low"])
    .order("stock", { ascending: true, nullsFirst: true })
    .order("name")
    .limit(limit)
    .overrideTypes<AdminRow[], { merge: false }>();
  if (error) throw new Error(`could not list stock alerts: ${error.message}`);
  return (data ?? []).map(toAdmin);
}

/** What the shelves hold, at selling price: counted lines only. */
export async function inventoryValue(): Promise<{ units: number; value: number; counted: number; untracked: number }> {
  const { data, error } = await db()
    .from("products")
    .select("price,stock,status")
    .neq("status", "archived")
    .limit(5000);
  if (error) throw new Error(`could not read inventory: ${error.message}`);
  let units = 0, value = 0, counted = 0, untracked = 0;
  for (const r of data ?? []) {
    if (r.stock == null) { untracked++; continue; }
    counted++;
    const n = Math.max(0, r.stock);
    units += n;
    value += n * r.price;
  }
  return { units, value, counted, untracked };
}

// -------------------------------------------------------------------- writes

export type ProductInput = {
  name: string;
  slug: string;
  sku: string;
  status: "active" | "draft";
  categories: CategorySlug[];
  summary: string;
  description: string[];
  price: number;
  compareAt: number | null;
  specs: Spec[];
  tags: string[];
  images: string[];
  variants: Variant[];
  featured: boolean;
  inStock: boolean;
  lowStockAt: number;
  /** null: do not count this line. A number: the count on the shelf. */
  stock: number | null;
};

function toColumns(input: ProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    status: input.status,
    categories: input.categories,
    summary: input.summary,
    description: input.description,
    price: input.price,
    compare_at: input.compareAt,
    specs: input.specs,
    tags: input.tags,
    images: input.images,
    variants: input.variants.length ? input.variants : null,
    featured: input.featured,
    in_stock: input.inStock,
    low_stock_at: input.lowStockAt,
  };
}

export async function createProduct(input: ProductInput, actor: string): Promise<string> {
  const { data: last } = await db()
    .from("products")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const { data, error } = await db()
    .from("products")
    .insert({ ...toColumns(input), position: (last?.position ?? 0) + 1 })
    .select("id")
    .single<{ id: string }>();
  if (error) throw new Error(`could not create product: ${error.message}`);

  // The opening count goes through the ledger like every other stock change.
  if (input.stock != null) await setStockLevel(data.id, input.stock, "Opening count", actor);
  return data.id;
}

export async function updateProduct(id: string, input: ProductInput, actor: string): Promise<void> {
  const current = await getAdminProduct(id);
  if (!current) throw new Error("update_product: that product no longer exists");

  const { error } = await db().from("products").update(toColumns(input)).eq("id", id);
  if (error) throw new Error(`could not save product: ${error.message}`);

  // A changed count is a stocktake (or the start or end of counting), and is
  // written to the ledger rather than silently overwritten.
  if (input.stock !== current.stock) {
    await setStockLevel(id, input.stock, "Edited on the product page", actor);
  }
}

async function setStockLevel(id: string, level: number | null, note: string, actor: string): Promise<void> {
  const { error } = await db().rpc("set_stock", { p_product_id: id, p_level: level, p_note: note, p_actor: actor });
  if (error) throw new Error(`could not set stock: ${error.message}`);
}

export async function setProductStatus(ids: string[], status: ProductStatus): Promise<number> {
  const { data, error } = await db().from("products").update({ status }).in("id", ids).select("id");
  if (error) throw new Error(`could not update status: ${error.message}`);
  return data?.length ?? 0;
}

/**
 * Gone for good — only from the trash, so nothing is deleted in one click.
 * Order history is unaffected (orders keep their own snapshot of each line),
 * and the stock ledger keeps its rows with the product's name.
 */
export async function deleteProductForever(id: string): Promise<{ name: string; images: string[] }> {
  const product = await getAdminProduct(id);
  if (!product) throw new Error("delete_product: that product no longer exists");
  if (product.status !== "archived") throw new Error("delete_product: move it to the trash first");
  const { error } = await db().from("products").delete().eq("id", id).eq("status", "archived");
  if (error) throw new Error(`could not delete product: ${error.message}`);
  return { name: product.name, images: product.images };
}

export async function duplicateProduct(id: string, actor: string): Promise<string> {
  const source = await getAdminProduct(id);
  if (!source) throw new Error("duplicate_product: that product no longer exists");
  let slug = `${source.slug}-copy`.slice(0, 110);
  for (let n = 2; n < 50; n++) {
    const { count } = await db().from("products").select("id", { count: "exact", head: true }).eq("slug", slug);
    if (!count) break;
    slug = `${source.slug}-copy-${n}`.slice(0, 110);
  }
  return createProduct(
    {
      name: `${source.name} (copy)`.slice(0, 200),
      slug,
      sku: "",
      status: "draft",
      categories: source.categories,
      summary: source.summary,
      description: source.description,
      price: source.price,
      compareAt: source.compareAt,
      specs: source.specs,
      tags: source.tags,
      images: source.images,
      variants: source.variants,
      featured: false,
      inStock: source.inStock,
      lowStockAt: source.lowStockAt,
      // a copy starts uncounted: stock belongs to the original's shelf
      stock: null,
    },
    actor,
  );
}

export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  let query = db().from("products").select("id", { count: "exact", head: true }).eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { count, error } = await query;
  if (error) throw new Error(`could not check slug: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function importBundledCatalogue(actor: string): Promise<number> {
  const { data, error } = await db().rpc("import_products", { p_products: BUNDLED_PRODUCTS, p_actor: actor });
  if (error) throw new Error(`could not import catalogue: ${error.message}`);
  return data as number;
}

// -------------------------------------------------------------------- photos

export const IMAGE_BUCKET = "product-images";
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
export const IMAGE_MAX_BYTES = 4 * 1024 * 1024;

/** The public URL prefix of the photo bucket, or null when Supabase is not configured. */
export function imageBucketUrl(): string | null {
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  return base ? `${base}/storage/v1/object/public/${IMAGE_BUCKET}/` : null;
}

export async function uploadProductImage(bytes: Buffer, contentType: string): Promise<string> {
  const ext = IMAGE_TYPES[contentType];
  if (!ext) throw new Error("upload_image: that file type is not an image the shop can show");
  const path = `products/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
  const { error } = await db().storage.from(IMAGE_BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`upload_image: ${error.message}`);
  return db().storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Remove photos from the bucket that no product uses any more. */
export async function removeOrphanImages(urls: string[]): Promise<void> {
  const prefix = imageBucketUrl();
  if (!prefix) return;
  const ours = urls.filter((u) => u.startsWith(prefix));
  if (!ours.length) return;
  const { data } = await db().from("products").select("images").overlaps("images", ours);
  const stillUsed = new Set((data ?? []).flatMap((r: { images: string[] }) => r.images));
  const orphans = ours.filter((u) => !stillUsed.has(u)).map((u) => u.slice(prefix.length));
  if (orphans.length) await db().storage.from(IMAGE_BUCKET).remove(orphans);
}
