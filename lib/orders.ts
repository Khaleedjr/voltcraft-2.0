import { maxOrderable, type Product } from "@/lib/catalogue";
import { SITE } from "@/lib/site";

/** Flat national delivery fee, waived above the free-delivery threshold. */
export const DELIVERY_FEE = 3_500;

export type OrderLineInput = { slug: string; qty: number };

/**
 * Anything priceOrder can price: the full product on the server, the lean
 * copy the browser holds for its cart.
 */
export type Priceable = Pick<Product, "slug" | "name" | "sku" | "price" | "inStock" | "stock">;

export type PricedLine<P extends Priceable = Product> = { product: P; qty: number; lineTotal: number };

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
 * Lines for the same product are merged before the stock cap is applied, so
 * listing a product twice cannot order past what is on the shelf.
 */
export function priceOrder<P extends Priceable>(
  lines: OrderLineInput[],
  lookup: (slug: string) => P | undefined,
): PricedOrder<P> {
  const wanted = new Map<string, number>();
  for (const line of lines) {
    const qty = Math.floor(line.qty);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    wanted.set(line.slug, (wanted.get(line.slug) ?? 0) + qty);
  }

  const items: PricedLine<P>[] = [];
  for (const [slug, qty] of wanted) {
    const product = lookup(slug);
    if (!product) continue;
    const capped = Math.min(qty, maxOrderable(product));
    if (capped <= 0) continue;
    items.push({ product, qty: capped, lineTotal: product.price * capped });
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
    return [{ slug: line.slug, qty: Math.min(line.qty, 10_000) }];
  });
}

export const SITE_URL_FALLBACK = SITE.url;
