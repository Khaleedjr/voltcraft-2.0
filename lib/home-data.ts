import "server-only";
import { getCategories, maxOrderable, primaryCategory, type CategorySlug, type Product } from "@/lib/catalogue";
import { getCategoryCounts, getCategoryThumbnails, getFeaturedSale, getProducts } from "@/lib/catalogue-data";
import { getKit, KITS } from "@/lib/kits";

/**
 * Everything the home page versions draw from, read once: the aisles and
 * their counts, a few photographed products per aisle, the sale, the kit.
 * Every number on those pages comes from here, so none of them is made up.
 */
export async function getHomeData() {
  const categories = getCategories();
  const [products, sale, ticker, counts, thumbs, kit] = await Promise.all([
    getProducts(),
    getFeaturedSale(5),
    getFeaturedSale(12),
    getCategoryCounts(),
    getCategoryThumbnails(),
    getKit(KITS[0].slug),
  ]);

  const shots: Partial<Record<CategorySlug, Product[]>> = {};
  for (const p of products) {
    if (!p.images.length) continue;
    const c = primaryCategory(p);
    const list = (shots[c] ??= []);
    if (list.length < 4) list.push(p);
  }

  const photographed = products.filter((p) => p.images.length && maxOrderable(p) > 0);
  const microcontrollers = photographed.filter((p) => primaryCategory(p) === "microcontrollers").slice(0, 4);

  return {
    categories,
    counts,
    thumbs,
    shots,
    sale,
    ticker,
    kit,
    microcontrollers,
    /** A spread of photographed parts, one per aisle in turn, for floating and scrolling decoration. */
    spread: categories.flatMap((c, i) => (shots[c.slug] ?? []).slice(i % 2, (i % 2) + 1)),
    total: products.length,
    inStock: products.filter((p) => maxOrderable(p) > 0).length,
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
