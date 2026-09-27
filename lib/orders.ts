import { maxOrderable, type Product } from "@/lib/catalogue";
import { SITE } from "@/lib/site";

/** Flat national delivery fee, waived above the free-delivery threshold. */
export const DELIVERY_FEE = 3_500;

/** `variant` is the label of the option chosen, for a product sold in options. */
export type OrderLineInput = { slug: string; variant?: string; qty: number };

/** One cart line per product and option: two resistor values are two lines. */
export function lineKey(line: { slug: string; variant?: string }): string {
  return line.variant ? `${line.slug}\u0000${line.variant}` : line.slug;
}

/**
 * Which lines draw on the same shelf. A counted product has one shelf, so all
 * its options share the count. An uncounted one has no shelf to share: each
 * option line gets the per-line ceiling on its own, so thirty resistor values
 * are not squeezed into one line's allowance.
 */
export function stockPool(product: Pick<Product, "slug" | "stock">, variant: string | undefined): string {
  return product.stock == null ? lineKey({ slug: product.slug, variant }) : product.slug;
}

/**
 * Anything priceOrder can price: the full product on the server, the lean
 * copy the browser holds for its cart.
 */
export type Priceable = Pick<Product, "slug" | "name" | "sku" | "price" | "inStock" | "stock" | "variants">;

export type PricedLine<P extends Priceable = Product> = {
  product: P;
  variant?: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

/**
 * What one unit costs. A product sold in options must be bought as one of
 * them, at that option's price; a product without options has no option to
 * name. Anything else — an option since removed, or never offered — is null,
 * and the line is not sold.
 */
export function unitPriceFor(product: Pick<Product, "price" | "variants">, variant: string | undefined): number | null {
  if (product.variants?.length) {
    return product.variants.find((v) => v.label === variant)?.price ?? null;
  }
  return variant ? null : product.price;
}

export type PricedOrder<P extends Priceable = Product> = {
  items: PricedLine<P>[];
  subtotal: number;
  delivery: number;
  total: number;
  freeDelivery: boolean;
};

/**
 * The one place an order total is calculated. The cart UI and the payment
 * route both call this, so the browser never gets to tell the server what
 * something costs — prices always come from the catalogue, through `lookup`.
 *
 * Stock is counted per product, not per option, so for a counted product the
 * cap applies to all its lines together: listing it twice, or in two options,
 * cannot order past what is on the shelf. See stockPool.
 */
export function priceOrder<P extends Priceable>(
  lines: OrderLineInput[],
  lookup: (slug: string) => P | undefined,
): PricedOrder<P> {
  const wanted = new Map<string, OrderLineInput>();
  for (const line of lines) {
    const qty = Math.floor(line.qty);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    const key = lineKey(line);
    const merged = wanted.get(key);
    wanted.set(key, { slug: line.slug, ...(line.variant ? { variant: line.variant } : {}), qty: (merged?.qty ?? 0) + qty });
  }

  const items: PricedLine<P>[] = [];
  const taken = new Map<string, number>();
  for (const { slug, variant, qty } of wanted.values()) {
    const product = lookup(slug);
    if (!product) continue;
    const unitPrice = unitPriceFor(product, variant);
    if (unitPrice == null) continue;
    const pool = stockPool(product, variant);
    const already = taken.get(pool) ?? 0;
    const capped = Math.min(qty, maxOrderable(product) - already);
    if (capped <= 0) continue;
    taken.set(pool, already + capped);
    items.push({ product, ...(variant ? { variant } : {}), unitPrice, qty: capped, lineTotal: unitPrice * capped });
  }
  const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
  const freeDelivery = subtotal >= SITE.freeDeliveryThreshold;
  const delivery = items.length === 0 || freeDelivery ? 0 : DELIVERY_FEE;
  return { items, subtotal, delivery, total: subtotal + delivery, freeDelivery };
}

/** Human-readable, sortable, and safe to show a customer over the phone. */
export function createOrderReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const salt = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VC-${stamp}-${salt}`;
}

export type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  notes?: string;
};

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT — Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
] as const;

export const STATES: readonly string[] = NIGERIAN_STATES;

export function parseCustomer(value: unknown): CustomerDetails | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const required = ["name", "email", "phone", "address", "city", "state"] as const;
  const out: Record<string, string> = {};
  for (const key of required) {
    const field = v[key];
    if (typeof field !== "string") return null;
    const trimmed = field.trim();
    if (!trimmed || trimmed.length > 300) return null;
    out[key] = trimmed;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) return null;
  if (out.phone.replace(/\D/g, "").length < 10) return null;
  if (typeof v.notes === "string" && v.notes.length <= 1000) out.notes = v.notes.trim();
  return out as CustomerDetails;
}

/** A cart holds tens of lines, not thousands: anything past this is not a real cart. */
const MAX_LINES = 100;

export function parseLines(value: unknown): OrderLineInput[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_LINES).flatMap((l) => {
    if (typeof l !== "object" || l === null) return [];
    const line = l as Record<string, unknown>;
    if (typeof line.slug !== "string" || line.slug.length > 200) return [];
    if (typeof line.qty !== "number" || !Number.isFinite(line.qty)) return [];
    const variant = typeof line.variant === "string" && line.variant && line.variant.length <= 100 ? line.variant : undefined;
    return [{ slug: line.slug, ...(variant ? { variant } : {}), qty: Math.min(line.qty, 10_000) }];
  });
}

export const SITE_URL_FALLBACK = SITE.url;
