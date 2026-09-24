import "server-only";
import type { Fulfilment, PaymentStatus } from "@/components/admin/badges";
import { lagosDayStart } from "@/lib/admin/format";
import { cleanSearch, likePattern } from "@/lib/admin/search";
import type { StoredLine } from "@/lib/order-store";
import { db, readAll } from "@/lib/supabase";

/**
 * The admin's side of orders: finding them, reading them in full, and the
 * things staff do to them. Every change goes through a database function
 * (supabase/schema.sql) that writes the timeline entry in the same
 * transaction, and moves stock where the change implies it.
 */

export type AdminOrder = {
  reference: string;
  status: PaymentStatus;
  fulfilment: Fulfilment;
  tracking: string | null;
  internalNote: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  notes: string | null;
  items: StoredLine[];
  subtotal: number;
  delivery: number;
  total: number;
  paidAmount: number | null;
  paidChannel: string | null;
  paidAt: string | null;
  stockAppliedAt: string | null;
  stockRestoredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderEvent = { id: number; kind: string; message: string; actor: string; createdAt: string };

type OrderRow = {
  reference: string;
  status: PaymentStatus;
  fulfilment: Fulfilment;
  tracking: string | null;
  internal_note: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  state: string;
  notes: string | null;
  items: StoredLine[];
  subtotal: number;
  delivery: number;
  total: number;
  paid_amount: number | null;
  paid_channel: string | null;
  paid_at: string | null;
  stock_applied_at: string | null;
  stock_restored_at: string | null;
  created_at: string;
  updated_at: string;
};

export const ORDER_COLUMNS =
  "reference,status,fulfilment,tracking,internal_note,customer_name,customer_email,customer_phone,address,city,state," +
  "notes,items,subtotal,delivery,total,paid_amount,paid_channel,paid_at,stock_applied_at,stock_restored_at,created_at,updated_at";

export function toAdminOrder(r: OrderRow): AdminOrder {
  return {
    reference: r.reference,
    status: r.status,
    fulfilment: r.fulfilment,
    tracking: r.tracking,
    internalNote: r.internal_note,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    address: r.address,
    city: r.city,
    state: r.state,
    notes: r.notes,
    items: r.items ?? [],
    subtotal: r.subtotal,
    delivery: r.delivery,
    total: r.total,
    paidAmount: r.paid_amount,
    paidChannel: r.paid_channel,
    paidAt: r.paid_at,
    stockAppliedAt: r.stock_applied_at,
    stockRestoredAt: r.stock_restored_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// --------------------------------------------------------------------- views

export const ORDER_VIEWS = {
  all: "All",
  "to-pack": "To pack",
  awaiting: "Awaiting payment",
  shipped: "Shipped",
  delivered: "Delivered",
  attention: "Needs a look",
  failed: "Payment failed",
  cancelled: "Cancelled",
} as const;
export type OrderView = keyof typeof ORDER_VIEWS;

// PostgREST filter builders are not worth typing by hand; each view is a
// function over whatever the query is.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Q = any;
const VIEW_FILTERS: Record<OrderView, (q: Q) => Q> = {
  all: (q) => q,
  "to-pack": (q) => q.eq("status", "paid").in("fulfilment", ["unfulfilled", "packed"]),
  awaiting: (q) => q.eq("status", "pending").neq("fulfilment", "cancelled"),
  shipped: (q) => q.eq("fulfilment", "shipped"),
  delivered: (q) => q.eq("fulfilment", "delivered"),
  // paid, but not the amount priced: nothing ships until someone checks
  attention: (q) => q.eq("status", "mismatch").neq("fulfilment", "cancelled"),
  // the charge did not go through; worth a call while the customer still wants it
  failed: (q) => q.eq("status", "failed").neq("fulfilment", "cancelled"),
  cancelled: (q) => q.eq("fulfilment", "cancelled"),
};

export type OrderFilters = { view?: OrderView; q?: string; from?: string; to?: string };

function applyFilters(query: Q, f: OrderFilters, { withView = true } = {}): Q {
  let q = query;
  if (withView) q = VIEW_FILTERS[f.view ?? "all"](q);
  const term = cleanSearch(f.q);
  if (term) {
    const like = likePattern(term);
    const parts = [`reference.ilike.${like}`, `customer_name.ilike.${like}`, `customer_email.ilike.${like}`];
    // phone numbers: match on the last ten digits, however they were typed
    const digits = term.replace(/\D/g, "");
    if (digits.length >= 4) parts.push(`phone_digits.ilike.*${digits.length > 10 ? digits.slice(-10) : digits.replace(/^0/, "")}*`);
    q = q.or(parts.join(","));
  }
  const from = f.from ? lagosDayStart(f.from) : null;
  if (from) q = q.gte("created_at", from);
  const toStart = f.to ? lagosDayStart(f.to) : null;
  if (toStart) q = q.lt("created_at", new Date(Date.parse(toStart) + 86_400_000).toISOString());
  return q;
}

export async function listOrders(
  filters: OrderFilters & { page?: number; perPage?: number },
): Promise<{ rows: AdminOrder[]; total: number; page: number; pageCount: number; counts: Record<OrderView, number> }> {
  const perPage = filters.perPage ?? 25;
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * perPage;

  const list = applyFilters(db().from("orders").select(ORDER_COLUMNS, { count: "exact" }), filters)
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  // Tab counts respect the search and dates, so the numbers match what a click shows.
  const views = Object.keys(ORDER_VIEWS) as OrderView[];
  const countQueries = views.map((v) =>
    VIEW_FILTERS[v](applyFilters(db().from("orders").select("reference", { count: "exact", head: true }), filters, { withView: false })),
  );
  const [listResult, ...countResults] = await Promise.all([list, ...countQueries]);
  if (listResult.error) throw new Error(`could not list orders: ${listResult.error.message}`);
  const counts = Object.fromEntries(views.map((v, i) => [v, countResults[i]?.count ?? 0])) as Record<OrderView, number>;

  const total = listResult.count ?? 0;
  return {
    rows: ((listResult.data ?? []) as OrderRow[]).map(toAdminOrder),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    counts,
  };
}

/** Every order matching the filters, for export. */
export async function allOrders(filters: OrderFilters): Promise<AdminOrder[]> {
  const rows = await readAll<OrderRow>((from, to) =>
    applyFilters(db().from("orders").select(ORDER_COLUMNS), filters).order("created_at", { ascending: false }).range(from, to),
  );
  return rows.map(toAdminOrder);
}

export async function getOrderWithEvents(reference: string): Promise<{ order: AdminOrder; events: OrderEvent[] } | null> {
  if (!/^[A-Z0-9-]{4,40}$/i.test(reference)) return null;
  const [o, e] = await Promise.all([
    db().from("orders").select(ORDER_COLUMNS).eq("reference", reference).maybeSingle<OrderRow>(),
    db()
      .from("order_events")
      .select("id,kind,message,actor,created_at")
      .eq("order_reference", reference)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
  ]);
  if (o.error) throw new Error(`could not read order: ${o.error.message}`);
  if (!o.data) return null;
  return {
    order: toAdminOrder(o.data),
    events: (e.data ?? []).map((r: { id: number; kind: string; message: string; actor: string; created_at: string }) => ({
      id: r.id,
      kind: r.kind,
      message: r.message,
      actor: r.actor,
      createdAt: r.created_at,
    })),
  };
}

/** The latest orders placed, for the overview. */
export async function recentOrders(limit = 8): Promise<AdminOrder[]> {
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<OrderRow[], { merge: false }>();
  if (error) throw new Error(`could not read recent orders: ${error.message}`);
  return (data ?? []).map(toAdminOrder);
}

/** How many orders a view holds right now, optionally within the list's filters. */
export async function countOrders(view: OrderView, filters: OrderFilters = {}): Promise<number> {
  const { count, error } = await VIEW_FILTERS[view](
    applyFilters(db().from("orders").select("reference", { count: "exact", head: true }), filters, { withView: false }),
  );
  if (error) throw new Error(`could not count orders: ${error.message}`);
  return count ?? 0;
}

/** A customer's other orders, newest first — for the order page's sidebar. */
export async function ordersForEmail(email: string, limit = 50): Promise<AdminOrder[]> {
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_COLUMNS)
    .ilike("customer_email", email.replace(/[%_\\]/g, "\\$&"))
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<OrderRow[], { merge: false }>();
  if (error) throw new Error(`could not read customer orders: ${error.message}`);
  return (data ?? []).map(toAdminOrder);
}

// ------------------------------------------------------------------- actions

async function rpc(fn: string, args: Record<string, unknown>): Promise<void> {
  const { error } = await db().rpc(fn, args);
  if (error) throw new Error(error.message);
}

export const recordPayment = (a: { reference: string; amount: number; channel: string; note: string; actor: string }) =>
  rpc("record_payment", { p_reference: a.reference, p_amount: a.amount, p_channel: a.channel, p_note: a.note, p_actor: a.actor });

export const setFulfilment = (a: { reference: string; fulfilment: Fulfilment; tracking: string; actor: string }) =>
  rpc("set_fulfilment", { p_reference: a.reference, p_fulfilment: a.fulfilment, p_tracking: a.tracking, p_actor: a.actor });

export const cancelOrder = (a: { reference: string; refunded: boolean; note: string; actor: string }) =>
  rpc("cancel_order", { p_reference: a.reference, p_refunded: a.refunded, p_note: a.note, p_actor: a.actor });

export async function saveInternalNote(a: { reference: string; note: string; actor: string }): Promise<void> {
  const { data, error } = await db()
    .from("orders")
    .update({ internal_note: a.note || null })
    .eq("reference", a.reference)
    .select("reference");
  if (error) throw new Error(`could not save the note: ${error.message}`);
  if (!data?.length) throw new Error("save_note: that order no longer exists");
  const { error: e2 } = await db()
    .from("order_events")
    .insert({ order_reference: a.reference, kind: "note", message: a.note ? `Note: ${a.note}` : "Note cleared", actor: a.actor });
  if (e2) throw new Error(`could not log the note: ${e2.message}`);
}
