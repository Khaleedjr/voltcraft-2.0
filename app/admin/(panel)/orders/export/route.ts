import { requireAdmin } from "@/lib/admin/auth";
import { csvResponse } from "@/lib/admin/csv";
import { formatDateTime, lagosToday } from "@/lib/admin/format";
import { allOrders, ORDER_VIEWS, type OrderView } from "@/lib/admin/orders";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Orders as a CSV file, with the same filters as the list. Cells are defused in csvResponse. */

const day = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export async function GET(request: Request) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return new Response("The database is not connected.", { status: 503 });

  const sp = new URL(request.url).searchParams;
  const viewRaw = sp.get("view") ?? "all";
  const view: OrderView = viewRaw in ORDER_VIEWS ? (viewRaw as OrderView) : "all";
  const orders = await allOrders({ view, q: sp.get("q") ?? undefined, from: day(sp.get("from")), to: day(sp.get("to")) });

  const header = [
    "Reference", "Placed (Lagos)", "Payment", "Fulfilment", "Customer", "Email", "Phone", "Address", "City", "State",
    "Items", "Units", "Subtotal", "Delivery", "Total", "Paid", "Channel", "Paid at (Lagos)", "Tracking", "Customer note",
  ];
  const rows = orders.map((o) => [
    o.reference,
    formatDateTime(o.createdAt),
    o.status,
    o.fulfilment,
    o.customerName,
    o.customerEmail,
    o.customerPhone,
    o.address,
    o.city,
    o.state,
    o.items.map((i) => `${i.qty} x ${i.name}`).join("; "),
    o.items.reduce((n, i) => n + i.qty, 0),
    o.subtotal,
    o.delivery,
    o.total,
    o.paidAmount ?? "",
    o.paidChannel ?? "",
    o.paidAt ? formatDateTime(o.paidAt) : "",
    o.tracking ?? "",
    o.notes ?? "",
  ]);

  return csvResponse(`orders-${lagosToday()}`, header, rows);
}
