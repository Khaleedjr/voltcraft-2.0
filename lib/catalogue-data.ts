import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import bundled from "@/data/catalogue.json";
import {
  CATEGORY_SLUGS,
  discountPercent,
  isCategorySlug,
  primaryCategory,
  toLite,
  type CategorySlug,
  type LiteProduct,
  type Product,
  type Spec,
  type Variant,
} from "@/lib/catalogue";
import { db, isSupabaseConfigured, readAll } from "@/lib/supabase";

/**
 * Where the shop's products come from.
 *
 * The database is the source of truth once it has been filled. Until then —
 * no Supabase keys, or keys set but the catalogue not yet imported from the
 * admin — the shop serves the bundled data/catalogue.json, so switching the
 * database on never empties a live shop.
 *
 * Reads are cached and tagged PRODUCTS_TAG. Every admin write, and every paid
 * order that moves stock, invalidates the tag, so the shop reflects a change on
 * the next request rather than on the next deploy. The five-minute revalidate
 * is only a backstop.
 */

export const PRODUCTS_TAG = "products";

export type CatalogueSource = "database" | "bundled";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  woo_id: string | null;
  status: "active" | "draft" | "archived";
  categories: string[];
  summary: string;
  description: string[];
  price: number;
  compare_at: number | null;
  stock: number | null;
  in_stock: boolean;
  low_stock_at: number;
  specs: Spec[] | null;
  tags: string[];
  images: string[];
  variants: Variant[] | null;
  featured: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export const PRODUCT_COLUMNS =
  "id,slug,name,sku,woo_id,status,categories,summary,description,price,compare_at,stock,in_stock," +
  "low_stock_at,specs,tags,images,variants,featured,position,created_at,updated_at";

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    wooId: row.woo_id ?? "",
    categories: row.categories.filter(isCategorySlug),
    summary: row.summary,
    description: row.description,
    price: row.price,
    ...(row.compare_at != null ? { compareAt: row.compare_at } : {}),
    inStock: row.in_stock,
    stock: row.stock,
    specs: row.specs ?? [],
    tags: row.tags,
    images: row.images,
    ...(row.variants?.length ? { variants: row.variants } : {}),
    featured: row.featured,
    lowStockAt: row.low_stock_at,
  };
}

export const BUNDLED_PRODUCTS: Product[] = bundled.products as Product[];

type Catalogue = { source: CatalogueSource; products: Product[] };

/** Has anyone imported the catalogue yet? Any row at all, in any status, counts. */
export async function isCatalogueImported(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { count, error } = await db().from("products").select("id", { count: "exact", head: true });
  if (error) throw new Error(`could not count products: ${error.message}`);
  return (count ?? 0) > 0;
}

async function loadCatalogue(): Promise<Catalogue> {
  if (!isSupabaseConfigured()) return { source: "bundled", products: BUNDLED_PRODUCTS };

  const rows = await readAll<ProductRow>((from, to) =>
    db()
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("status", "active")
      .order("position")
      .order("name")
      .range(from, to)
      .overrideTypes<ProductRow[], { merge: false }>(),
  );

  if (rows.length === 0 && !(await isCatalogueImported())) {
    return { source: "bundled", products: BUNDLED_PRODUCTS };
  }
  return { source: "database", products: rows.map(rowToProduct) };
}

/**
 * The cache outlives builds and deploys, so its key names where the data came
 * from. Without that, adding the Supabase keys and redeploying would keep
 * serving the catalogue cached from the bundled file until the backstop
 * expired it; likewise a regenerated catalogue.json. The URL is hashed so the
 * key says which database without writing its address into the cache.
 */
const SOURCE_KEY = isSupabaseConfigured()
  ? `db:${createHash("sha256").update(process.env.SUPABASE_URL ?? "").digest("hex").slice(0, 12)}`
  : `bundled:${createHash("sha256").update(JSON.stringify(BUNDLED_PRODUCTS)).digest("hex").slice(0, 12)}`;

/**
 * A failed read throws rather than falling back: on a prerendered page that
 * keeps the last good version in place, which is better than quietly
 * serving the bundled prices in the middle of a database outage.
 */
const loadCatalogueCached = unstable_cache(loadCatalogue, ["catalogue-v1", SOURCE_KEY], {
  tags: [PRODUCTS_TAG],
  revalidate: 300,
});

/** Once per render, however many components ask. */
const getCatalogue = cache(() => loadCatalogueCached());

// ----------------------------------------------------------------- shop reads

export async function getProducts(): Promise<Product[]> {
  return (await getCatalogue()).products;
}

export async function getCatalogueSource(): Promise<CatalogueSource> {
  return (await getCatalogue()).source;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  return (await getProducts()).filter((p) => (p.categories as string[]).includes(slug));
}

export async function getCategoryCounts(): Promise<Record<CategorySlug, number>> {
  const counts = Object.fromEntries(CATEGORY_SLUGS.map((s) => [s, 0])) as Record<CategorySlug, number>;
  for (const p of await getProducts()) for (const c of p.categories) counts[c] += 1;
  return counts;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return (await getProducts()).filter((p) => {
    const haystack = [p.name, p.sku, p.summary, ...p.categories, ...p.tags, ...p.specs.map((s) => s.value)]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

export async function relatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const primary = primaryCategory(product);
  return (await getProducts())
    .filter((p) => p.slug !== product.slug && p.categories.includes(primary))
    .slice(0, limit);
}

/** Discounted lines, deepest cut first — the shop's strongest hook. */
export async function getOnSale(limit = 8): Promise<Product[]> {
  return (await getProducts())
    .filter((p) => discountPercent(p) !== null && p.images.length)
    .sort((a, b) => (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0))
    .slice(0, limit);
}

/** One photographed product per aisle, for the category tiles. */
export async function getCategoryThumbnails(): Promise<Partial<Record<CategorySlug, Product>>> {
  const out: Partial<Record<CategorySlug, Product>> = {};
  for (const p of await getProducts()) {
    if (!p.images.length) continue;
    for (const c of p.categories) out[c] ??= p;
  }
  return out;
}

/** What the browser needs to draw and price a cart, and nothing more. */
export async function getLiteCatalogue(): Promise<LiteProduct[]> {
  return (await getProducts()).map(toLite);
}

// ------------------------------------------------------------ checkout reads

/**
 * The products a checkout is priced from — read fresh, never from the cache,
 * so a price or stock change made a moment ago is what gets charged.
 */
export async function getProductsForCheckout(slugs: string[]): Promise<Product[]> {
  const wanted = [...new Set(slugs)].slice(0, 200);
  if (wanted.length === 0) return [];
  if (!isSupabaseConfigured()) return BUNDLED_PRODUCTS.filter((p) => wanted.includes(p.slug));

  const { data, error } = await db()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("slug", wanted)
    .eq("status", "active")
    .overrideTypes<ProductRow[], { merge: false }>();
  if (error) throw new Error(`could not read products for checkout: ${error.message}`);
  if (data.length > 0) return data.map(rowToProduct);

  // Nothing matched: either those lines are gone, or the shop is still on the
  // bundled catalogue because nothing has been imported.
  return (await isCatalogueImported()) ? [] : BUNDLED_PRODUCTS.filter((p) => wanted.includes(p.slug));
}
