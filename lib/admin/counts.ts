import "server-only";
import type { NavCounts } from "@/components/admin/shell";
import { db } from "@/lib/supabase";

/** The numbers on the admin nav: what is waiting on a person right now. */
export async function getNavCounts(): Promise<NavCounts> {
  const orders = () => db().from("orders").select("reference", { count: "exact", head: true });
  const [toFulfil, attention, lowStock] = await Promise.all([
    // paid and not yet on its way
    orders().eq("status", "paid").in("fulfilment", ["unfulfilled", "packed"]),
    // paid the wrong amount — someone has to look before anything ships
    orders().eq("status", "mismatch").neq("fulfilment", "cancelled"),
    db()
      .from("products")
      .select("id", { count: "exact", head: true })
      .neq("status", "archived")
      .in("stock_state", ["low", "out"]),
  ]);
  for (const r of [toFulfil, attention, lowStock]) if (r.error) throw new Error(r.error.message);
  return { toFulfil: toFulfil.count ?? 0, attention: attention.count ?? 0, lowStock: lowStock.count ?? 0 };
}
