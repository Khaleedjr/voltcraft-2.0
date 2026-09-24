"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { done, explain, fail, type ActionResult } from "@/lib/admin/action-result";
import { requireAdmin } from "@/lib/admin/auth";
import { parseProductForm } from "@/lib/admin/product-form";
import {
  createProduct,
  deleteProductForever,
  duplicateProduct,
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  imageBucketUrl,
  importBundledCatalogue,
  isSlugTaken,
  removeOrphanImages,
  setProductStatus,
  updateProduct,
  uploadProductImage,
  type ProductStatus,
} from "@/lib/admin/products";
import { PRODUCTS_TAG } from "@/lib/catalogue-data";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * Every action here is a public POST endpoint as far as the network is
 * concerned, so each one checks the session itself before anything else, and
 * treats its FormData as untrusted. Writes end with updateTag, which expires
 * the shop's cached catalogue: the change is live on the next page view.
 */

/** Photos the shop's image optimiser is allowed to fetch — see next.config.ts. */
const SITE_IMAGES = [
  "https://voltcraft.org.ng/wp-content/uploads/",
  "https://www.voltcraft.org.ng/wp-content/uploads/",
];

function imagePrefixes(): string[] {
  const bucket = imageBucketUrl();
  return bucket ? [bucket, ...SITE_IMAGES] : SITE_IMAGES;
}

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

function noDatabase(): ActionResult {
  return fail("The database is not connected, so nothing can be saved yet.");
}

export async function saveProduct(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return noDatabase();

  const id = String(fd.get("id") ?? "");
  if (id && !isUuid(id)) return fail("That product could not be found.");

  const parsed = parseProductForm(fd, { imagePrefixes: imagePrefixes() });
  if (!parsed.ok) return fail("Some fields need another look.", parsed.errors);

  let createdId: string | null = null;
  try {
    if (await isSlugTaken(parsed.input.slug, id || undefined)) {
      return fail("Some fields need another look.", { slug: "Another product already uses this URL." });
    }
    if (id) await updateProduct(id, parsed.input, admin.email);
    else createdId = await createProduct(parsed.input, admin.email);
  } catch (error) {
    console.error("[admin] save product", error);
    return fail(explain(error, "The product could not be saved. Please try again."));
  }

  updateTag(PRODUCTS_TAG);
  if (createdId) redirect(`/admin/products/${createdId}?created=1`);
  return done(`Saved. The shop shows the change from now on.`);
}

const STATUS_MESSAGES: Record<ProductStatus, (n: number) => string> = {
  active: (n) => `${n} product${n === 1 ? " is" : "s are"} live in the shop.`,
  draft: (n) => `${n} product${n === 1 ? " is" : "s are"} hidden as draft${n === 1 ? "" : "s"}.`,
  archived: (n) => `${n} product${n === 1 ? "" : "s"} moved to the trash.`,
};

export async function changeProductStatus(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!isSupabaseConfigured()) return noDatabase();

  const ids = [...new Set(fd.getAll("ids").map(String))].filter(isUuid).slice(0, 500);
  if (ids.length === 0) return fail("Tick at least one product first.");

  // Deleting for good, from the trash only (deleteProductForever refuses anything else).
  if (fd.get("status") === "delete") {
    let deleted = 0;
    const images: string[] = [];
    for (const id of ids) {
      try {
        const removed = await deleteProductForever(id);
        images.push(...removed.images);
        deleted++;
      } catch (error) {
        console.error("[admin] bulk delete", id, error);
      }
    }
    await removeOrphanImages(images).catch((error) => console.error("[admin] image cleanup", error));
    updateTag(PRODUCTS_TAG);
    return deleted === ids.length
      ? done(`${deleted} product${deleted === 1 ? " was" : "s were"} deleted for good.`)
      : fail(`${deleted} of ${ids.length} deleted. The rest were not in the trash, or could not be removed.`);
  }

  const status = String(fd.get("status") ?? "") as ProductStatus;
  if (!(status in STATUS_MESSAGES)) return fail("Choose what to do with them.");

  try {
    const n = await setProductStatus(ids, status);
    updateTag(PRODUCTS_TAG);
    return done(STATUS_MESSAGES[status](n));
  } catch (error) {
    console.error("[admin] change status", error);
    return fail(explain(error));
  }
}

export async function deleteProduct(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!isSupabaseConfigured()) return noDatabase();

  const id = String(fd.get("id") ?? "");
  if (!isUuid(id)) return fail("That product could not be found.");

  let name = "";
  try {
    const removed = await deleteProductForever(id);
    name = removed.name;
    await removeOrphanImages(removed.images).catch((error) => console.error("[admin] image cleanup", error));
  } catch (error) {
    return fail(explain(error));
  }
  updateTag(PRODUCTS_TAG);
  if (fd.get("from") === "editor") redirect(`/admin/products?view=archived&deleted=${encodeURIComponent(name)}`);
  return done(`${name} was deleted for good.`);
}

export async function duplicateProductAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return noDatabase();

  const id = String(fd.get("id") ?? "");
  if (!isUuid(id)) return fail("That product could not be found.");

  let copyId: string;
  try {
    copyId = await duplicateProduct(id, admin.email);
  } catch (error) {
    return fail(explain(error));
  }
  updateTag(PRODUCTS_TAG);
  redirect(`/admin/products/${copyId}?duplicated=1`);
}

export async function importCatalogue(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return noDatabase();
  try {
    const n = await importBundledCatalogue(admin.email);
    updateTag(PRODUCTS_TAG);
    return done(`Imported ${n} products. The shop now runs from the database.`);
  } catch (error) {
    console.error("[admin] import", error);
    return fail(explain(error, "The import did not run. Nothing was changed."));
  }
}

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadImage(fd: FormData): Promise<UploadResult> {
  await requireAdmin();
  if (!isSupabaseConfigured()) return { ok: false, error: "The database is not connected, so photos cannot be stored yet." };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a photo to upload." };
  if (!IMAGE_TYPES[file.type]) return { ok: false, error: "Use a JPEG, PNG, WebP, AVIF or GIF image." };
  if (file.size > IMAGE_MAX_BYTES) return { ok: false, error: "That photo is over 4 MB — try a smaller one." };

  try {
    const url = await uploadProductImage(Buffer.from(await file.arrayBuffer()), file.type);
    return { ok: true, url };
  } catch (error) {
    console.error("[admin] upload", error);
    return { ok: false, error: explain(error, "The photo could not be uploaded. Please try again.") };
  }
}
