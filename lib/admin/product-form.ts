import { isCategorySlug, type CategorySlug, type Spec, type Variant } from "@/lib/catalogue";
import type { ProductInput } from "@/lib/admin/products";
import { SLUG_PATTERN, slugify } from "@/lib/slug";

/**
 * The product form, read and checked. Pure: FormData in, a clean ProductInput
 * or a set of field messages out — so the rules are the same whichever way
 * the form was submitted, and can be tested on their own.
 */

export const LIMITS = {
  name: 200,
  slug: 110,
  sku: 64,
  summary: 400,
  description: 20_000,
  paragraphs: 40,
  specs: 40,
  specLabel: 80,
  specValue: 200,
  tags: 30,
  tag: 40,
  images: 12,
  variants: 20,
  maxPrice: 100_000_000,
  maxStock: 1_000_000,
} as const;

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const all = (fd: FormData, key: string) => fd.getAll(key).map((v) => String(v).trim());

/** "₦12,500" or "12500" → 12500. Null for empty; NaN for anything that is not whole naira. */
export function parseNaira(raw: string): number | null {
  const s = raw.replace(/[₦,\s]/g, "").replace(/^NGN/i, "");
  if (!s) return null;
  if (!/^\d+$/.test(s)) return Number.NaN;
  return Number(s);
}

function parseWhole(raw: string): number | null {
  const s = raw.replace(/[,\s]/g, "");
  if (!s) return null;
  return /^-?\d+$/.test(s) ? Number(s) : Number.NaN;
}

export type ParsedProduct = { ok: true; input: ProductInput } | { ok: false; errors: Record<string, string> };

export function parseProductForm(fd: FormData, { imagePrefixes }: { imagePrefixes: string[] }): ParsedProduct {
  const errors: Record<string, string> = {};

  // ---- basics
  const name = text(fd, "name").replace(/\s+/g, " ");
  if (!name) errors.name = "Give the product a name.";
  else if (name.length > LIMITS.name) errors.name = `Keep the name under ${LIMITS.name} characters.`;

  const slug = (text(fd, "slug") || slugify(name)).toLowerCase();
  if (!slug) errors.slug = "A URL slug is needed.";
  else if (slug.length > LIMITS.slug || !SLUG_PATTERN.test(slug)) {
    errors.slug = "Lowercase letters, numbers and single hyphens only.";
  }

  const sku = text(fd, "sku");
  if (sku.length > LIMITS.sku) errors.sku = `Keep the SKU under ${LIMITS.sku} characters.`;

  const statusRaw = text(fd, "status");
  const status = statusRaw === "draft" ? "draft" : "active";

  const categories = [...new Set(all(fd, "categories"))].filter(isCategorySlug) as CategorySlug[];
  if (categories.length === 0) errors.categories = "Choose at least one aisle.";

  // ---- pricing
  const price = parseNaira(text(fd, "price"));
  if (price === null) errors.price = "Set a price.";
  else if (Number.isNaN(price)) errors.price = "Whole naira only — no kobo, no letters.";
  else if (price > LIMITS.maxPrice) errors.price = "That price looks too high.";

  const compareAt = parseNaira(text(fd, "compareAt"));
  if (compareAt !== null) {
    if (Number.isNaN(compareAt)) errors.compareAt = "Whole naira only.";
    else if (price !== null && !Number.isNaN(price) && compareAt <= price) {
      errors.compareAt = "The was-price must be higher than the price, or left empty.";
    }
  }

  const variantLabels = all(fd, "variantLabel");
  const variantPrices = all(fd, "variantPrice");
  const variants: Variant[] = [];
  variantLabels.forEach((label, i) => {
    const raw = variantPrices[i] ?? "";
    if (!label && !raw) return;
    const vp = parseNaira(raw);
    if (!label || vp === null || Number.isNaN(vp)) {
      errors.variants = "Each option needs a label and a whole-naira price.";
      return;
    }
    variants.push({ label: label.slice(0, LIMITS.specLabel), price: vp });
  });
  if (variants.length > LIMITS.variants) errors.variants = `At most ${LIMITS.variants} options.`;

  // ---- words
  const summary = text(fd, "summary").replace(/\s+/g, " ");
  if (summary.length > LIMITS.summary) errors.summary = `Keep the summary under ${LIMITS.summary} characters.`;

  const descriptionRaw = String(fd.get("description") ?? "").replace(/\r\n/g, "\n").trim();
  const description = descriptionRaw
    ? descriptionRaw.split(/\n\s*\n/).map((p) => p.replace(/[ \t]+/g, " ").trim()).filter(Boolean)
    : [];
  if (descriptionRaw.length > LIMITS.description) errors.description = "The description is too long.";
  else if (description.length > LIMITS.paragraphs) errors.description = `At most ${LIMITS.paragraphs} paragraphs.`;

  const specLabels = all(fd, "specLabel");
  const specValues = all(fd, "specValue");
  const specs: Spec[] = [];
  specLabels.forEach((label, i) => {
    const value = specValues[i] ?? "";
    if (!label && !value) return;
    if (!label || !value) {
      errors.specs = "Each specification needs both a name and a value.";
      return;
    }
    if (label.length > LIMITS.specLabel || value.length > LIMITS.specValue) {
      errors.specs = "A specification is too long.";
      return;
    }
    specs.push({ label, value });
  });
  if (specs.length > LIMITS.specs) errors.specs = `At most ${LIMITS.specs} specifications.`;

  const tags = [
    ...new Set(
      text(fd, "tags")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (tags.length > LIMITS.tags || tags.some((t) => t.length > LIMITS.tag)) {
    errors.tags = `Up to ${LIMITS.tags} tags, each under ${LIMITS.tag} characters.`;
  }

  // ---- photos: only from places the shop's image optimiser will fetch
  const images = [...new Set(all(fd, "images").filter(Boolean))];
  if (images.length > LIMITS.images) errors.images = `At most ${LIMITS.images} photos.`;
  const foreign = images.find((u) => !imagePrefixes.some((p) => u.startsWith(p)));
  if (foreign) {
    errors.images = "Upload photos here, or link to images already on voltcraft.org.ng — other sites won't load in the shop.";
  }

  // ---- stock
  const tracked = fd.get("trackStock") === "on";
  let stock: number | null = null;
  if (tracked) {
    const n = parseWhole(text(fd, "stock"));
    if (n === null) errors.stock = "How many are on the shelf?";
    else if (Number.isNaN(n) || n < 0) errors.stock = "A whole number, zero or more.";
    else if (n > LIMITS.maxStock) errors.stock = "That count looks too high.";
    else stock = n;
  }
  const lowRaw = parseWhole(text(fd, "lowStockAt"));
  const lowStockAt = lowRaw === null ? 5 : lowRaw;
  if (Number.isNaN(lowStockAt) || lowStockAt < 0 || lowStockAt > 10_000) {
    errors.lowStockAt = "A whole number, zero or more.";
  }
  // A counted line is available whenever its count is above zero; the switch
  // only means something for lines the shop does not count.
  const inStock = tracked ? true : fd.get("inStock") === "on";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: {
      name,
      slug,
      sku,
      status,
      categories,
      summary,
      description,
      price: price as number,
      compareAt,
      specs,
      tags,
      images,
      variants,
      featured: fd.get("featured") === "on",
      inStock,
      lowStockAt,
      stock,
    },
  };
}
