import "server-only";
import { isSale } from "@/lib/admin/analytics";
import { lagosDay } from "@/lib/admin/format";
import type { AdminOrder } from "@/lib/admin/orders";
import { cleanSearch, likePattern } from "@/lib/admin/search";
import { db, readAll } from "@/lib/supabase";

/**
 * Customers, as the shop knows them: everyone who has ordered, grouped by
 * email address (the customer_summaries view in supabase/schema.sql). There
 * are no accounts to manage — this is a record of who buys, not a login list.
 */

export type Customer = {
  email: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  orders: number;
  paidOrders: number;
  spent: number;
  firstOrderAt: string;
  lastOrderAt: string;
};

type Row = {
  email: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  orders: number;
  paid_orders: number;
  spent: number;
  first_order_at: string;
  last_order_at: string;
};

const COLUMNS = "email,name,phone,city,state,orders,paid_orders,spent,first_order_at,last_order_at";

const toCustomer = (r: Row): Customer => ({
  email: r.email,
  name: r.name,
  phone: r.phone,
  city: r.city,
  state: r.state,
  orders: r.orders,
  paidOrders: r.paid_orders,
  spent: Number(r.spent), // bigint arrives as a number or a string, depending on size
  firstOrderAt: r.first_order_at,
  lastOrderAt: r.last_order_at,
});

export const CUSTOMER_VIEWS = {
  all: "All",
  repeat: "Repeat buyers",
  once: "Bought once",
  unpaid: "Never paid",
} as const;
export type CustomerView = keyof typeof CUSTOMER_VIEWS;

export const CUSTOMER_SORTS = {
  recent: { label: "Latest order", column: "last_order_at", ascending: false },
  spent: { label: "Most spent", column: "spent", ascending: false },
  orders: { label: "Most orders", column: "paid_orders", ascending: false },
  newest: { label: "Newest customers", column: "first_order_at", ascending: false },
  name: { label: "Name A–Z", column: "name", ascending: true },
} as const;
export type CustomerSort = keyof typeof CUSTOMER_SORTS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Q = any;
const VIEW_FILTERS: Record<CustomerView, (q: Q) => Q> = {
  all: (q) => q,
  repeat: (q) => q.gte("paid_orders", 2),
  once: (q) => q.eq("paid_orders", 1),
  unpaid: (q) => q.eq("paid_orders", 0),
};

function search(query: Q, raw: string | undefined): Q {
  const term = cleanSearch(raw);
  if (!term) return query;
  const like = likePattern(term);
  const parts = [`name.ilike.${like}`, `email.ilike.${like}`];
  const digits = term.replace(/\D/g, "");
  if (digits.length >= 4) parts.push(`phone_digits.ilike.*${digits.length > 10 ? digits.slice(-10) : digits.replace(/^0/, "")}*`);
  return query.or(parts.join(","));
}

export type CustomerFilters = { view?: CustomerView; q?: string; sort?: CustomerSort };

export async function listCustomers(
  f: CustomerFilters & { page?: number; perPage?: number },
): Promise<{ rows: Customer[]; total: number; page: number; pageCount: number; counts: Record<CustomerView, number> }> {
  const perPage = f.perPage ?? 25;
  const page = Math.max(1, f.page ?? 1);
  const sort = CUSTOMER_SORTS[f.sort ?? "recent"];
  const start = (page - 1) * perPage;

  const list = VIEW_FILTERS[f.view ?? "all"](search(db().from("customer_summaries").select(COLUMNS, { count: "exact" }), f.q))
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .order("email", { ascending: true })
    .range(start, start + perPage - 1);
  const views = Object.keys(CUSTOMER_VIEWS) as CustomerView[];
  const countQueries = views.map((v) => VIEW_FILTERS[v](search(db().from("customer_summaries").select("email", { count: "exact", head: true }), f.q)));
  const [result, ...countResults] = await Promise.all([list, ...countQueries]);
  if (result.error) throw new Error(`could not list customers: ${result.error.message}`);

  const total = result.count ?? 0;
  return {
    rows: ((result.data ?? []) as Row[]).map(toCustomer),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    counts: Object.fromEntries(views.map((v, i) => [v, countResults[i]?.count ?? 0])) as Record<CustomerView, number>,
  };
}

/** Every customer matching the filters, for the download. */
export async function allCustomers(f: CustomerFilters): Promise<Customer[]> {
  const sort = CUSTOMER_SORTS[f.sort ?? "recent"];
  const rows = await readAll<Row>((a, b) =>
    VIEW_FILTERS[f.view ?? "all"](search(db().from("customer_summaries").select(COLUMNS), f.q))
      .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
      .order("email", { ascending: true })
      .range(a, b),
  );
  return rows.map(toCustomer);
}

export async function getCustomer(email: string): Promise<Customer | null> {
  const { data, error } = await db().from("customer_summaries").select(COLUMNS).eq("email", email.trim().toLowerCase()).maybeSingle<Row>();
  if (error) throw new Error(`could not read the customer: ${error.message}`);
  return data ? toCustomer(data) : null;
}

/** The headline numbers across every customer. */
export async function customerStats(today: string): Promise<{
  customers: number;
  buyers: number;
  repeat: number;
  averageSpend: number;
  newThisMonth: number;
}> {
  const rows = await readAll<{ paid_orders: number; spent: number; first_order_at: string }>((a, b) =>
    db().from("customer_summaries").select("paid_orders,spent,first_order_at").order("email").range(a, b),
  );
  const month = today.slice(0, 7);
  let buyers = 0, repeat = 0, spent = 0, fresh = 0;
  for (const r of rows) {
    if (r.paid_orders > 0) buyers++;
    if (r.paid_orders > 1) repeat++;
    spent += Number(r.spent);
    if (lagosDay(r.first_order_at).slice(0, 7) === month) fresh++;
  }
  return { customers: rows.length, buyers, repeat, averageSpend: buyers ? Math.round(spent / buyers) : 0, newThisMonth: fresh };
}

export type BoughtLine = { key: string; productId: string | null; name: string; image: string | null; units: number; spent: number; lastAt: string };

/** What a customer has bought, across their sales, most spent first. */
export function productsBought(orders: AdminOrder[]): BoughtLine[] {
  const lines = new Map<string, BoughtLine>();
  for (const o of orders) {
    if (!isSale(o)) continue;
    for (const i of o.items) {
      const key = i.productId ?? `slug:${i.slug}`;
      const line = lines.get(key) ?? { key, productId: i.productId ?? null, name: i.name, image: i.image ?? null, units: 0, spent: 0, lastAt: o.createdAt };
      line.units += i.qty;
      line.spent += i.lineTotal;
      if (o.createdAt > line.lastAt) line.lastAt = o.createdAt;
      lines.set(key, line);
    }
  }
  return [...lines.values()].sort((a, b) => b.spent - a.spent || b.units - a.units);
}
