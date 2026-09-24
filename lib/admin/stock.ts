import "server-only";
import { cleanSearch, likePattern } from "@/lib/admin/search";
import { db } from "@/lib/supabase";

/**
 * The stock ledger: reading it, and the three ways a person changes stock.
 * Every change goes through a database function that locks the product row
 * and writes the ledger entry in the same transaction (supabase/schema.sql).
 */

export const REASONS = {
  restock: { label: "Restock", hint: "A delivery came in" },
  sale: { label: "Sale", hint: "An order was paid" },
  cancellation: { label: "Cancelled order", hint: "Stock put back from a cancelled order" },
  return: { label: "Return", hint: "A customer brought something back" },
  damage: { label: "Damaged / lost", hint: "Broken, lost or written off" },
  adjustment: { label: "Adjustment", hint: "A correction, with a note" },
  stocktake: { label: "Stocktake", hint: "Counted on the shelf" },
  initial: { label: "Counting began", hint: "Opening count" },
} as const;

export type Reason = keyof typeof REASONS;
export const MANUAL_REASONS = ["restock", "return", "damage", "adjustment"] as const;
export type ManualReason = (typeof MANUAL_REASONS)[number];

export function isReason(v: string): v is Reason {
  return v in REASONS;
}

export type Movement = {
  id: number;
  productId: string | null;
  productSlug: string;
  productName: string;
  delta: number;
  stockAfter: number | null;
  reason: Reason;
  note: string | null;
  orderReference: string | null;
  batchId: string | null;
  actor: string;
  createdAt: string;
};

type MovementRow = {
  id: number;
  product_id: string | null;
  product_slug: string;
  product_name: string;
  delta: number;
  stock_after: number | null;
  reason: Reason;
  note: string | null;
  order_reference: string | null;
  batch_id: string | null;
  actor: string;
  created_at: string;
};

const COLUMNS =
  "id,product_id,product_slug,product_name,delta,stock_after,reason,note,order_reference,batch_id,actor,created_at";

function toMovement(r: MovementRow): Movement {
  return {
    id: r.id,
    productId: r.product_id,
    productSlug: r.product_slug,
    productName: r.product_name,
    delta: r.delta,
    stockAfter: r.stock_after,
    reason: r.reason,
    note: r.note,
    orderReference: r.order_reference,
    batchId: r.batch_id,
    actor: r.actor,
    createdAt: r.created_at,
  };
}

export async function listMovements(params: {
  productId?: string;
  reason?: string;
  direction?: "in" | "out";
  q?: string;
  page?: number;
  perPage?: number;
}): Promise<{ rows: Movement[]; total: number; page: number; pageCount: number }> {
  const perPage = params.perPage ?? 30;
  const page = Math.max(1, params.page ?? 1);
  let query = db().from("stock_movements").select(COLUMNS, { count: "exact" });
  if (params.productId) query = query.eq("product_id", params.productId);
  if (params.reason && isReason(params.reason)) query = query.eq("reason", params.reason);
  if (params.direction === "in") query = query.gt("delta", 0);
  if (params.direction === "out") query = query.lt("delta", 0);
  const q = cleanSearch(params.q);
  if (q) {
    const like = likePattern(q);
    query = query.or(`product_name.ilike.${like},note.ilike.${like},order_reference.ilike.${like},actor.ilike.${like}`);
  }
  const from = (page - 1) * perPage;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + perPage - 1)
    .overrideTypes<MovementRow[], { merge: false }>();
  if (error) throw new Error(`could not read the stock ledger: ${error.message}`);
  const total = count ?? 0;
  return { rows: (data ?? []).map(toMovement), total, page, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

/** Units in and out, by reason, over the last `days` — for the stock page's summary. */
export async function movementTotals(days: number): Promise<Record<Reason, { units: number; lines: number }>> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await db()
    .from("stock_movements")
    .select("reason,delta")
    .gte("created_at", since)
    .limit(10_000);
  if (error) throw new Error(`could not total the stock ledger: ${error.message}`);
  const out = Object.fromEntries(Object.keys(REASONS).map((k) => [k, { units: 0, lines: 0 }])) as Record<
    Reason,
    { units: number; lines: number }
  >;
  for (const r of (data ?? []) as { reason: Reason; delta: number }[]) {
    out[r.reason].units += r.delta;
    out[r.reason].lines += 1;
  }
  return out;
}

export async function adjustStock(input: {
  productId: string;
  delta: number;
  reason: ManualReason;
  note: string;
  actor: string;
}): Promise<number> {
  const { data, error } = await db().rpc("adjust_stock", {
    p_product_id: input.productId,
    p_delta: input.delta,
    p_reason: input.reason,
    p_note: input.note,
    p_actor: input.actor,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

export async function setStockCount(input: { productId: string; level: number; note: string; actor: string }): Promise<number> {
  const { data, error } = await db().rpc("set_stock", {
    p_product_id: input.productId,
    p_level: input.level,
    p_note: input.note,
    p_actor: input.actor,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

export async function receiveStock(input: {
  lines: { productId: string; qty: number }[];
  note: string;
  actor: string;
}): Promise<string> {
  const { data, error } = await db().rpc("receive_stock", {
    p_lines: input.lines,
    p_note: input.note,
    p_actor: input.actor,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
