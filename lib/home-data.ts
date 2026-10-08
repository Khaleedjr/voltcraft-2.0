import "server-only";
import { getCategories, maxOrderable, primaryCategory, type CategorySlug, type Product } from "@/lib/catalogue";
import { getCategoryCounts, getCategoryThumbnails, getFeaturedSale, getProducts } from "@/lib/catalogue-data";
import { getKit, KITS } from "@/lib/kits";

/**
 * The owner would rather not show the starter kit on sale on the home page:
 * the 4WD chassis takes its place wherever the sale is shown, and it stays
 * out of the row of boards. Its price is untouched everywhere else.
 */
const NOT_ON_SALE_HERE = "arduino-uno-starter-kit";
const IN_ITS_PLACE = "4wd-robot-car-chassis";

/** The list with the kit swapped for the chassis, which moves up to the kit's place. */
function swapKit(list: Product[], chassis: Product | undefined): Product[] {
  return list.flatMap((p) => {
    if (p.slug === NOT_ON_SALE_HERE) return chassis ? [chassis] : [];
    if (p.slug === IN_ITS_PLACE) return list.some((q) => q.slug === NOT_ON_SALE_HERE) ? [] : [p];
    return [p];
  });
}

/**
 * Everything the home page versions draw from, read once: the aisles and
 * their counts, a few photographed products per aisle, the sale, the kit.
 * Every number on those pages comes from here, so none of them is made up.
 */
export async function getHomeData() {
  const categories = getCategories();
  const [products, saleRead, tickerRead, counts, thumbs, kit] = await Promise.all([
    getProducts(),
    getFeaturedSale(6),
    getFeaturedSale(13),
    getCategoryCounts(),
    getCategoryThumbnails(),
    getKit(KITS[0].slug),
  ]);

  const chassis = products.find((p) => p.slug === IN_ITS_PLACE);
  const sale = swapKit(saleRead, chassis).slice(0, 5);
  const ticker = swapKit(tickerRead, chassis).slice(0, 12);

  const shots: Partial<Record<CategorySlug, Product[]>> = {};
  for (const p of products) {
    if (!p.images.length) continue;
    const c = primaryCategory(p);
    const list = (shots[c] ??= []);
    if (list.length < 4) list.push(p);
  }

  const photographed = products.filter((p) => p.images.length && maxOrderable(p) > 0);
  const microcontrollers = photographed
    .filter((p) => primaryCategory(p) === "microcontrollers" && p.slug !== NOT_ON_SALE_HERE)
    .slice(0, 4);

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
