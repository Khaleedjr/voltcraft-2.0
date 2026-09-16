import catalogue from "@/data/catalogue.json";

/**
 * The VoltCraft catalogue, imported from the store's WooCommerce export.
 *
 * data/catalogue.json is generated — do not hand-edit it. To refresh:
 *
 *   Products → Export → CSV in WP Admin, then
 *   node scripts/import-woocommerce.mjs <export.csv>
 *
 * Everything in the app reads through the accessors at the bottom of this file,
 * so the data source can change without touching a single page.
 */

export type CategorySlug =
  | "sensors"
  | "microcontrollers"
  | "display"
  | "actuators"
  | "connectors"
  | "accessories"
  | "switches"
  | "power"
  | "fluid-control";

export type Category = {
  slug: CategorySlug;
  name: string;
  blurb: string;
  /** What a buyer in this aisle is usually solving for. */
  note: string;
};

export type Spec = { label: string; value: string };
export type Variant = { label: string; price: number };

export type Product = {
  slug: string;
  name: string;
  sku: string;
  wooId: string;
  categories: CategorySlug[];
  summary: string;
  description: string[];
  price: number;
  compareAt?: number;
  inStock: boolean;
  /** null when the store marks it in stock without tracking a count. */
  stock: number | null;
  specs: Spec[];
  tags: string[];
  images: string[];
  variants?: Variant[];
  featured?: boolean;
};

export const CATEGORIES: Category[] = [
  {
    slug: "sensors",
    name: "Sensors",
    blurb: "Motion, distance, temperature, gas, current, light and touch.",
    note: "How the project finds out what is going on.",
  },
  {
    slug: "microcontrollers",
    name: "Microcontrollers",
    blurb: "Arduino-compatible boards, ESP modules and programmers.",
    note: "Start here if the project needs a brain.",
  },
  {
    slug: "display",
    name: "Display",
    blurb: "LCD and OLED modules, LEDs and indicators.",
    note: "So the thing can tell you what it is doing.",
  },
  {
    slug: "actuators",
    name: "Actuators",
    blurb: "Servos, steppers, motors, pumps and drivers.",
    note: "The part that actually moves.",
  },
  {
    slug: "connectors",
    name: "Connectors",
    blurb: "Jumper wires, headers, terminals and battery leads.",
    note: "The half of the build that always runs out first.",
  },
  {
    slug: "accessories",
    name: "Accessories",
    blurb: "Breadboards, PCB, enclosures, cables and consumables.",
    note: "Getting from a diagram to something you can hold.",
  },
  {
    slug: "switches",
    name: "Switches",
    blurb: "Buttons, relays, toggles and limit switches.",
    note: "Input that survives being pressed a thousand times.",
  },
  {
    slug: "power",
    name: "Power",
    blurb: "Batteries, converters, regulators and supplies.",
    note: "Nigerian mains is not a given — plan for it.",
  },
  {
    slug: "fluid-control",
    name: "Fluid control",
    blurb: "Pumps and valves for water and irrigation builds.",
    note: "For anything that has to move liquid.",
  },
];

export const PRODUCTS: Product[] = catalogue.products as Product[];

// ------------------------------------------------------------------- accessors

/**
 * Listed A-Z. The declaration order in CATEGORIES is the schematic one
 * (sensing, then thinking, then doing); alphabetical is what a shopper
 * scans, so sorting happens here rather than by reordering the source.
 * Copied so the exported constant is never mutated.
 */
export function getCategories(): Category[] {
  return [...CATEGORIES].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getProducts(): Product[] {
  return PRODUCTS;
}

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return PRODUCTS.filter((p) => p.categories.includes(slug as CategorySlug));
}

/** The aisle a product is filed under first — drives breadcrumbs and glyphs. */
export function primaryCategory(product: Product): CategorySlug {
  return product.categories[0];
}

export function getFeaturedProducts(limit = 6): Product[] {
  const featured = PRODUCTS.filter((p) => p.featured && p.images.length);
  const pool = featured.length >= limit ? featured : PRODUCTS.filter((p) => p.images.length);
  return pool.slice(0, limit);
}

export function countByCategory(slug: CategorySlug): number {
  return PRODUCTS.reduce((n, p) => (p.categories.includes(slug) ? n + 1 : n), 0);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return PRODUCTS.filter((p) => {
    const haystack = [p.name, p.sku, p.summary, ...p.categories, ...p.tags, ...p.specs.map((s) => s.value)]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

export function relatedProducts(product: Product, limit = 3): Product[] {
  const primary = primaryCategory(product);
  return PRODUCTS.filter((p) => p.slug !== product.slug && p.categories.includes(primary)).slice(0, limit);
}

/** How many of a line someone may order when the store tracks no count. */
export const UNTRACKED_STOCK_CEILING = 20;

export function maxOrderable(product: Product): number {
  if (!product.inStock) return 0;
  return product.stock ?? UNTRACKED_STOCK_CEILING;
}

/** Low stock is a real signal — it decides whether someone orders today. */
export function stockLabel(product: Product): { text: string; tone: "in" | "low" | "out" } {
  if (!product.inStock) return { text: "Out of stock", tone: "out" };
  if (product.stock != null && product.stock <= 0) return { text: "Out of stock", tone: "out" };
  if (product.stock != null && product.stock <= 5) return { text: `Only ${product.stock} left`, tone: "low" };
  return { text: "In stock", tone: "in" };
}

/** How much off, for merchandising. Null when the line is not discounted. */
export function discountPercent(product: Product): number | null {
  if (!product.compareAt || product.compareAt <= product.price) return null;
  return Math.round((1 - product.price / product.compareAt) * 100);
}

/** Discounted lines, deepest cut first — the shop's strongest hook. */
export function getOnSale(limit = 8): Product[] {
  return PRODUCTS.filter((p) => discountPercent(p) !== null && p.images.length)
    .sort((a, b) => (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0))
    .slice(0, limit);
}

/** One photographed product per aisle, for the category tiles. */
export function categoryThumbnail(slug: CategorySlug): Product | undefined {
  return PRODUCTS.find((p) => p.categories.includes(slug) && p.images.length);
}

/** Variable products show a range; the listed price is the cheapest option. */
export function priceLabel(product: Product): string | null {
  if (!product.variants || product.variants.length < 2) return null;
  return "from";
}
