import { dailyRows, resolveRange } from "@/lib/admin/analytics";
import { requireAdmin } from "@/lib/admin/auth";
import { csvResponse } from "@/lib/admin/csv";
import { lagosToday } from "@/lib/admin/format";
import { ordersPlacedBetween } from "@/lib/admin/reports";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * The report's range as one row per day — what a bookkeeper reconciles
 * against the bank. Same range rules as the Analytics page.
 */
export async function GET(request: Request) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return new Response("The database is not connected.", { status: 503 });

  const sp = new URL(request.url).searchParams;
  const range = resolveRange(
    { range: sp.get("range") ?? undefined, from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined },
    lagosToday(),
  );
  const rows = dailyRows(range, await ordersPlacedBetween(range.from, range.to));

  return csvResponse(
    `daily-${range.from}-to-${range.to}`,
    ["Date (Lagos)", "Orders placed", "Paid orders", "Units sold", "Revenue (NGN)", "Of which delivery (NGN)", "Average order (NGN)"],
    rows.map((r) => [r.day, r.placed, r.orders, r.units, r.revenue, r.delivery, r.orders ? Math.round(r.revenue / r.orders) : 0]),
  );
}
