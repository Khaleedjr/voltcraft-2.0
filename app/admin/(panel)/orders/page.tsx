import type { Metadata } from "next";
import Link from "next/link";
import { FulfilmentBadge, PaymentBadge } from "@/components/admin/badges";
import { Icon } from "@/components/admin/icons";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { EmptyState, field, FilterTabs, LinkButton, PageHeader, Pagination, table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDateTime, formatRelative } from "@/lib/admin/format";
import { listOrders, ORDER_VIEWS, type OrderView } from "@/lib/admin/orders";
import { cleanSearch } from "@/lib/admin/search";
import { hrefWith, pageParam, param } from "@/lib/admin/url";
import { formatNaira } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Orders" };

const day = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return <NeedsDatabase title="Orders" />;

  const sp = await searchParams;
  const viewRaw = param(sp.view);
  const view: OrderView = viewRaw && viewRaw in ORDER_VIEWS ? (viewRaw as OrderView) : "all";
  const q = cleanSearch(sp.q);
  const from = day(param(sp.from));
  const to = day(param(sp.to));
  const page = pageParam(sp.page);

  const current = { view: view === "all" ? undefined : view, q: q || undefined, from, to };
  const { rows, counts, total, pageCount } = await listOrders({ view, q, from, to, page });
  const filtered = Boolean(q || from || to);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Orders"
        description="Every order placed in the shop — paid online, or waiting on the counter to arrange payment."
        actions={
          <LinkButton href={hrefWith("/admin/orders/export", current)} prefetch={false}>
            <Icon.Download className="size-4" /> Export CSV
          </LinkButton>
        }
      />

      <div className="min-w-0 border border-line bg-raised">
        <div className="border-b border-line px-2 sm:px-3">
          <FilterTabs
            active={view}
            items={(Object.keys(ORDER_VIEWS) as OrderView[]).map((v) => ({
              key: v,
              label: ORDER_VIEWS[v],
              count: counts[v],
              href: hrefWith("/admin/orders", current, { view: v === "all" ? null : v, page: null }),
            }))}
          />
        </div>

        <form method="get" role="search" className="flex flex-wrap items-end gap-2 border-b border-line px-4 py-3">
          {current.view ? <input type="hidden" name="view" value={current.view} /> : null}
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search orders</span>
            <Icon.Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input name="q" defaultValue={q} placeholder="Reference, name, email or phone" className={`${field.input} pl-9`} />
          </label>
          <label className="grid gap-1">
            <span className="text-[0.74rem] text-faint">From</span>
            <input type="date" name="from" defaultValue={from} className={`${field.input} w-40`} />
          </label>
          <label className="grid gap-1">
            <span className="text-[0.74rem] text-faint">To</span>
            <input type="date" name="to" defaultValue={to} className={`${field.input} w-40`} />
          </label>
          <button type="submit" className="h-10 border border-ink px-4 text-[0.86rem] font-semibold hover:bg-ink hover:text-ground">
            Apply
          </button>
          {filtered ? (
            <Link href={hrefWith("/admin/orders", { view: current.view })} className="px-2 py-2.5 text-[0.84rem] text-muted hover:text-live">
              Clear
            </Link>
          ) : null}
        </form>

        {rows.length === 0 ? (
          <EmptyState icon={<Icon.Orders />} title={filtered ? "No orders match" : view === "to-pack" ? "Nothing to pack" : "No orders here yet"}>
            {filtered
              ? "Try a wider date range, or search by the last digits of the phone number."
              : view === "to-pack"
                ? "Every paid order is on its way."
                : "Orders appear here the moment a customer checks out."}
          </EmptyState>
        ) : (
          <div className={table.wrap}>
            <table className={`${table.table} min-w-[860px]`}>
              <thead>
                <tr>
                  <th className={table.th}>Order</th>
                  <th className={table.th}>Customer</th>
                  <th className={table.th}>Items</th>
                  <th className={table.thRight}>Total</th>
                  <th className={table.th}>Payment</th>
                  <th className={table.th}>Fulfilment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const units = o.items.reduce((n, i) => n + i.qty, 0);
                  return (
                    <tr key={o.reference} className={table.tr}>
                      <td className={table.td}>
                        <Link href={`/admin/orders/${o.reference}`} className="font-mono text-[0.84rem] font-semibold hover:text-live">
                          {o.reference}
                        </Link>
                        <p className="text-[0.76rem] text-faint" title={formatDateTime(o.createdAt)}>
                          {formatRelative(o.createdAt)}
                        </p>
                      </td>
                      <td className={table.td}>
                        <p className="font-semibold leading-snug">{o.customerName}</p>
                        <p className="text-[0.78rem] text-faint">
                          {o.city}, {o.state}
                        </p>
                      </td>
                      <td className={`${table.td} max-w-[240px]`}>
                        <p className="truncate text-[0.84rem]">{o.items[0]?.name ?? "—"}</p>
                        <p className="text-[0.76rem] text-faint">
                          {units} unit{units === 1 ? "" : "s"}
                          {o.items.length > 1 ? ` · ${o.items.length} lines` : ""}
                        </p>
                      </td>
                      <td className={table.tdRight}>
                        {formatNaira(o.total)}
                        {o.paidChannel ? <p className="text-[0.72rem] text-faint">{o.paidChannel}</p> : null}
                      </td>
                      <td className={table.td}>
                        <PaymentBadge status={o.status} />
                      </td>
                      <td className={table.td}>
                        <FulfilmentBadge fulfilment={o.fulfilment} paid={o.status === "paid"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          noun={total === 1 ? "order" : "orders"}
          hrefFor={(n) => hrefWith("/admin/orders", current, { page: n === 1 ? null : n })}
        />
      </div>
    </div>
  );
}
