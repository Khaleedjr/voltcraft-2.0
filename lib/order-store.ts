import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CustomerDetails, PricedOrder } from "@/lib/orders";

/**
 * Where orders live.
 *
 * Configure with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The service-role
 * key bypasses row-level security, so it is server-only and must never be
 * exposed to the browser — hence no NEXT_PUBLIC_ prefix, and the "server-only"
 * import above, which turns a stray client import into a build error.
 *
 * When the keys are absent every call here reports "not configured" and the
 * checkout route falls back to logging, so the app still runs in a preview or
 * on a fresh clone. It refuses to take money in that state — see the route.
 */

export function isOrderStoreConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let cached: SupabaseClient | null = null;

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  cached ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export type OrderStatus = "pending" | "paid" | "failed" | "mismatch";

export type StoredOrder = {
  reference: string;
  status: OrderStatus;
  total: number;
  customerEmail: string;
  customerName: string;
  paidAmount: number | null;
  paidChannel: string | null;
  paidAt: string | null;
};

type OrderRow = {
  reference: string;
  status: OrderStatus;
  total: number;
  customer_email: string;
  customer_name: string;
  paid_amount: number | null;
  paid_channel: string | null;
  paid_at: string | null;
};

const SELECT = "reference,status,total,customer_email,customer_name,paid_amount,paid_channel,paid_at";

function toStored(row: OrderRow): StoredOrder {
  return {
    reference: row.reference,
    status: row.status,
    total: row.total,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    paidAmount: row.paid_amount,
    paidChannel: row.paid_channel,
    paidAt: row.paid_at,
  };
}

/**
 * Write the priced order before the customer is sent to Paystack, so a payment
 * can never arrive for an order we have no record of.
 */
export async function createPendingOrder(input: {
  reference: string;
  customer: CustomerDetails;
  order: PricedOrder;
}): Promise<void> {
  const { error } = await db()
    .from("orders")
    .insert({
      reference: input.reference,
      status: "pending",
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone,
      address: input.customer.address,
      city: input.customer.city,
      state: input.customer.state,
      notes: input.customer.notes ?? null,
      items: input.order.items.map((i) => ({
        sku: i.product.sku,
        slug: i.product.slug,
        name: i.product.name,
        qty: i.qty,
        unitPrice: i.product.price,
        lineTotal: i.lineTotal,
      })),
      subtotal: input.order.subtotal,
      delivery: input.order.delivery,
      total: input.order.total,
    });

  if (error) throw new Error(`could not write order ${input.reference}: ${error.message}`);
}

export async function getOrder(reference: string): Promise<StoredOrder | null> {
  const { data, error } = await db()
    .from("orders")
    .select(SELECT)
    .eq("reference", reference)
    .maybeSingle<OrderRow>();

  if (error) throw new Error(`could not read order ${reference}: ${error.message}`);
  return data ? toStored(data) : null;
}

export type SettleOutcome =
  | { result: "settled"; order: StoredOrder }
  /** A second delivery of an event already applied. Not an error. */
  | { result: "already"; order: StoredOrder }
  | { result: "missing" };

/**
 * Record the outcome of a payment.
 *
 * Idempotent by construction: the update is conditional on the row still being
 * `pending`, so Paystack delivering `charge.success` three times — which it
 * will, it retries — settles the order once and reports "already" after that.
 * Both the webhook and the callback page route through here, so whichever
 * arrives first wins and the other is a no-op.
 *
 * The amount is checked rather than trusted. If Paystack charged something
 * other than what we priced, the order is flagged `mismatch` instead of `paid`
 * so a person looks at it before anything ships.
 */
export async function settleOrder(input: {
  reference: string;
  paid: boolean;
  amountPaid: number | null;
  channel: string | null;
  paidAt: string | null;
}): Promise<SettleOutcome> {
  const existing = await getOrder(input.reference);
  if (!existing) return { result: "missing" };
  if (existing.status !== "pending") return { result: "already", order: existing };

  const status: OrderStatus = !input.paid
    ? "failed"
    : input.amountPaid !== null && input.amountPaid !== existing.total
      ? "mismatch"
      : "paid";

  const { data, error } = await db()
    .from("orders")
    .update({
      status,
      paid_amount: input.amountPaid,
      paid_channel: input.channel,
      paid_at: input.paidAt,
    })
    .eq("reference", input.reference)
    // the guard that makes this safe to run twice
    .eq("status", "pending")
    .select(SELECT)
    .maybeSingle<OrderRow>();

  if (error) throw new Error(`could not settle order ${input.reference}: ${error.message}`);

  // Lost the race to a concurrent delivery; it did the work.
  if (!data) {
    const now = await getOrder(input.reference);
    return now ? { result: "already", order: now } : { result: "missing" };
  }

  return { result: "settled", order: toStored(data) };
}
