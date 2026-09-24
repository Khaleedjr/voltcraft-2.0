import "server-only";
import type { CustomerDetails, PricedOrder } from "@/lib/orders";
import { db, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Where orders live — the checkout and payment side. The admin's reads and
 * staff actions on orders are in lib/admin/orders.ts.
 *
 * When Supabase is not configured every call here reports "not configured"
 * and the checkout route falls back to logging, so the app still runs in a
 * preview or on a fresh clone. It refuses to take money in that state — see
 * the route.
 */

export const isOrderStoreConfigured = isSupabaseConfigured;

export type OrderStatus = "pending" | "paid" | "failed" | "mismatch" | "refunded";

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

/** One line of an order as it is stored: a snapshot, not a join. */
export type StoredLine = {
  productId?: string;
  sku: string;
  slug: string;
  name: string;
  image?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export function snapshotLines(order: PricedOrder): StoredLine[] {
  return order.items.map((i) => ({
    ...(i.product.id ? { productId: i.product.id } : {}),
    sku: i.product.sku,
    slug: i.product.slug,
    name: i.product.name,
    ...(i.product.images[0] ? { image: i.product.images[0] } : {}),
    qty: i.qty,
    unitPrice: i.product.price,
    lineTotal: i.lineTotal,
  }));
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
      items: snapshotLines(input.order),
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
 * Record the outcome of a payment, through the database's settle_order.
 *
 * Idempotent by construction: only a pending order moves, under a row lock,
 * so Paystack delivering `charge.success` three times — which it will, it
 * retries — settles the order once and reports "already" after that. Both the
 * webhook and the callback page route through here, so whichever arrives
 * first wins and the other is a no-op.
 *
 * The amount is checked rather than trusted. If Paystack charged something
 * other than what we priced, the order is flagged `mismatch` instead of `paid`
 * so a person looks at it before anything ships. A paid order has its stock
 * taken off the shelf in the same transaction.
 */
export async function settleOrder(input: {
  reference: string;
  paid: boolean;
  amountPaid: number | null;
  channel: string | null;
  paidAt: string | null;
}): Promise<SettleOutcome> {
  const { data, error } = await db().rpc("settle_order", {
    p_reference: input.reference,
    p_paid: input.paid,
    p_amount: input.amountPaid,
    p_channel: input.channel,
    p_paid_at: input.paidAt,
    p_actor: "paystack",
  });

  if (error) throw new Error(`could not settle order ${input.reference}: ${error.message}`);

  const outcome = data as { outcome: "settled" | "already" | "missing"; order?: OrderRow };
  if (outcome.outcome === "missing" || !outcome.order) return { result: "missing" };
  return { result: outcome.outcome, order: toStored(outcome.order) };
}
