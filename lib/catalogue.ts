/**
 * The catalogue's shape and the pure rules about it — types, the aisles, and
 * helpers like stock labels and discounts.
 *
 * Nothing in this file touches data, so it is safe in the browser. The
 * products themselves are loaded on the server by lib/catalogue-data.ts (from
 * the database, or from the bundled data/catalogue.json until the database has
 * been filled), and the browser gets a lean copy through CatalogueProvider.
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
  /** The database id. Absent while the shop is serving the bundled catalogue. */
  id?: string;
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
  /** Counted lines at or below this read as "only N left". */
  lowStockAt?: number;
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

/**
 * The slice of a product the browser needs to draw and price a cart: no
 * descriptions, specs or tags, and only the first photo. The whole shop's
 * worth of these is small enough to hand to every page.
 */
export type LiteProduct = Pick<
  Product,
  "id" | "slug" | "name" | "sku" | "price" | "compareAt" | "inStock" | "stock" | "lowStockAt" | "categories" | "images"
>;

export function toLite(p: Product): LiteProduct {
  return {
    ...(p.id ? { id: p.id } : {}),
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    price: p.price,
    ...(p.compareAt != null ? { compareAt: p.compareAt } : {}),
    inStock: p.inStock,
    stock: p.stock,
    ...(p.lowStockAt != null ? { lowStockAt: p.lowStockAt } : {}),
    categories: p.categories,
    images: p.images.slice(0, 1),
  };
}

export const CATEGORY_SLUGS: CategorySlug[] = CATEGORIES.map((c) => c.slug);

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as string[]).includes(value);
}

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

/** The aisle a product is filed under first — drives breadcrumbs and glyphs. */
export function primaryCategory(product: Pick<Product, "categories">): CategorySlug {
  return product.categories[0];
}

/** How many of a line someone may order when the store tracks no count. */
export const UNTRACKED_STOCK_CEILING = 20;

/** A counted line that has oversold reads as zero, never as a negative. */
export function maxOrderable(product: Pick<Product, "inStock" | "stock">): number {
  if (!product.inStock) return 0;
  return product.stock == null ? UNTRACKED_STOCK_CEILING : Math.max(product.stock, 0);
}

/** The level at which a counted line reads as low, unless the product sets its own. */
export const DEFAULT_LOW_STOCK = 5;

/** Low stock is a real signal — it decides whether someone orders today. */
export function stockLabel(
  product: Pick<Product, "inStock" | "stock" | "lowStockAt">,
): { text: string; tone: "in" | "low" | "out" } {
  if (!product.inStock) return { text: "Out of stock", tone: "out" };
  if (product.stock != null && product.stock <= 0) return { text: "Out of stock", tone: "out" };
  if (product.stock != null && product.stock <= (product.lowStockAt ?? DEFAULT_LOW_STOCK)) {
    return { text: `Only ${product.stock} left`, tone: "low" };
  }
  return { text: "In stock", tone: "in" };
}

/** How much off, for merchandising. Null when the line is not discounted. */
export function discountPercent(product: Pick<Product, "price" | "compareAt">): number | null {
  if (!product.compareAt || product.compareAt <= product.price) return null;
  return Math.round((1 - product.price / product.compareAt) * 100);
}

/** Variable products show a range; the listed price is the cheapest option. */
export function priceLabel(product: Pick<Product, "variants">): string | null {
  if (!product.variants || product.variants.length < 2) return null;
  return "from";
}
