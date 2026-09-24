import { requireAdmin } from "@/lib/admin/auth";
import { allCustomers, CUSTOMER_SORTS, CUSTOMER_VIEWS, type CustomerSort, type CustomerView } from "@/lib/admin/customers";
import { csvResponse } from "@/lib/admin/csv";
import { formatDateTime, lagosToday } from "@/lib/admin/format";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Customers as a CSV file, with the same filters and order as the list. */
export async function GET(request: Request) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return new Response("The database is not connected.", { status: 503 });

  const sp = new URL(request.url).searchParams;
  const view = sp.get("view") ?? "all";
  const sort = sp.get("sort") ?? "recent";
  const customers = await allCustomers({
    view: view in CUSTOMER_VIEWS ? (view as CustomerView) : "all",
    sort: sort in CUSTOMER_SORTS ? (sort as CustomerSort) : "recent",
    q: sp.get("q") ?? undefined,
  });

  return csvResponse(
    `customers-${lagosToday()}`,
    ["Name", "Email", "Phone", "City", "State", "Orders placed", "Paid orders", "Spent (NGN)", "First order (Lagos)", "Last order (Lagos)"],
    customers.map((c) => [c.name, c.email, c.phone, c.city, c.state, c.orders, c.paidOrders, c.spent, formatDateTime(c.firstOrderAt), formatDateTime(c.lastOrderAt)]),
  );
}
