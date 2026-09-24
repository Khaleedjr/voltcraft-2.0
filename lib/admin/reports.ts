import "server-only";
import type { Fulfilment, PaymentStatus } from "@/components/admin/badges";
import { addDays, buildReport, type Report, type ReportOrder, type ReportProduct, type ReportRange } from "@/lib/admin/analytics";
import { lagosDay, lagosDayStart } from "@/lib/admin/format";
import type { StoredLine } from "@/lib/order-store";
import { db, readAll } from "@/lib/supabase";

/**
 * Loads what the reports are made of. The arithmetic is in analytics.ts; this
 * only reads rows — the columns a report needs, never the addresses or notes.
 */

type OrderRow = {
  reference: string;
  status: PaymentStatus;
  fulfilment: Fulfilment;
  customer_name: string;
  customer_email: string;
  city: string;
  state: string;
  items: StoredLine[] | null;
  subtotal: number;
  delivery: number;
  total: number;
  paid_channel: string | null;
  created_at: string;
};

const ORDER_COLUMNS =
  "reference,status,fulfilment,customer_name,customer_email,city,state,items,subtotal,delivery,total,paid_channel,created_at";

const toReportOrder = (r: OrderRow): ReportOrder => ({
  reference: r.reference,
  status: r.status,
  fulfilment: r.fulfilment,
  customerName: r.customer_name,
  customerEmail: r.customer_email,
  city: r.city,
  state: r.state,
  items: (r.items ?? []).map((i) => ({ productId: i.productId, slug: i.slug, name: i.name, image: i.image, qty: i.qty, lineTotal: i.lineTotal })),
  subtotal: r.subtotal,
  delivery: r.delivery,
  total: r.total,
  paidChannel: r.paid_channel,
  createdAt: r.created_at,
});

/** Every order placed on the Lagos days from–to, inclusive. */
export async function ordersPlacedBetween(from: string, to: string): Promise<ReportOrder[]> {
  const start = lagosDayStart(from);
  const end = lagosDayStart(addDays(to, 1));
  if (!start || !end) return [];
  const rows = await readAll<OrderRow>((a, b) =>
    db()
      .from("orders")
      .select(ORDER_COLUMNS)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .order("reference", { ascending: true })
      .range(a, b),
  );
  return rows.map(toReportOrder);
}

/** Every product, whatever its status — a sale of a product now in the trash still counts. */
export async function reportProducts(): Promise<ReportProduct[]> {
  const rows = await readAll<{ id: string; slug: string; name: string; images: string[]; categories: string[]; stock: number | null; status: string }>(
    (a, b) => db().from("products").select("id,slug,name,images,categories,stock,status").order("id").range(a, b),
  );
  return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, image: r.images?.[0] ?? null, categories: r.categories ?? [], stock: r.stock, status: r.status }));
}

/**
 * The Lagos day each customer first ordered on, for everyone who has ordered
 * since `since` — enough to tell new customers from returning ones.
 */
export async function firstOrderDays(since: string): Promise<Map<string, string>> {
  const start = lagosDayStart(since);
  if (!start) return new Map();
  const rows = await readAll<{ email: string; first_order_at: string }>((a, b) =>
    db().from("customer_summaries").select("email,first_order_at").gte("last_order_at", start).order("email").range(a, b),
  );
  return new Map(rows.map((r) => [r.email, lagosDay(r.first_order_at)]));
}

/** A range's report, and the orders it was made from (current and previous period). */
export async function loadReport(range: ReportRange, topProducts = 10): Promise<{ report: Report; orders: ReportOrder[] }> {
  const [orders, products, firstOrderDay] = await Promise.all([
    ordersPlacedBetween(range.previous.from, range.to),
    reportProducts(),
    firstOrderDays(range.previous.from),
  ]);
  return { report: buildReport({ range, orders, products, firstOrderDay, topProducts }), orders };
}
