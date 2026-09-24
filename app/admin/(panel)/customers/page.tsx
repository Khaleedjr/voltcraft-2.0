import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitSelect } from "@/components/admin/client";
import { Icon } from "@/components/admin/icons";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { EmptyState, field, FilterTabs, LinkButton, PageHeader, Pagination, Panel, Stat, table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { CUSTOMER_SORTS, CUSTOMER_VIEWS, customerStats, listCustomers, type CustomerSort, type CustomerView } from "@/lib/admin/customers";
import { formatCount, formatDate, formatPercent, formatRelative, lagosToday } from "@/lib/admin/format";
import { cleanSearch } from "@/lib/admin/search";
import { hrefWith, pageParam, param } from "@/lib/admin/url";
import { formatNaira } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return <NeedsDatabase title="Customers" />;

  const sp = await searchParams;
  const viewRaw = param(sp.view);
  const view: CustomerView = viewRaw && viewRaw in CUSTOMER_VIEWS ? (viewRaw as CustomerView) : "all";
  const sortRaw = param(sp.sort);
  const sort: CustomerSort = sortRaw && sortRaw in CUSTOMER_SORTS ? (sortRaw as CustomerSort) : "recent";
  const q = cleanSearch(sp.q);
  const page = pageParam(sp.page);
  const current = { view: view === "all" ? undefined : view, q: q || undefined, sort: sort === "recent" ? undefined : sort };

  const [{ rows, counts, total, pageCount }, stats] = await Promise.all([listCustomers({ view, q, sort, page }), customerStats(lagosToday())]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Customers"
        description="Everyone who has ordered, one row per email address. Spend counts paid orders that were not cancelled."
        actions={
          <LinkButton href={hrefWith("/admin/customers/export", current)} prefetch={false}>
            <Icon.Download className="size-4" /> Export CSV
          </LinkButton>
        }
      />

      <Panel>
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
          <Stat label="Customers" value={formatCount(stats.customers)} note={`${formatCount(stats.buyers)} have paid`} />
          <Stat
            label="Came back"
            value={stats.buyers ? formatPercent(stats.repeat / stats.buyers) : "—"}
            note={`${formatCount(stats.repeat)} paid more than once`}
          />
          <Stat label="Average spend" value={formatNaira(stats.averageSpend)} note="per paying customer, all time" />
          <Stat label="New this month" value={formatCount(stats.newThisMonth)} note="first order this calendar month" />
        </div>
      </Panel>

      <div className="min-w-0 border border-line bg-raised">
        <div className="border-b border-line px-2 sm:px-3">
          <FilterTabs
            active={view}
            items={(Object.keys(CUSTOMER_VIEWS) as CustomerView[]).map((v) => ({
              key: v,
              label: CUSTOMER_VIEWS[v],
              count: counts[v],
              href: hrefWith("/admin/customers", current, { view: v === "all" ? null : v, page: null }),
            }))}
          />
        </div>

        <form method="get" role="search" className="flex flex-wrap items-end gap-2 border-b border-line px-4 py-3">
          {current.view ? <input type="hidden" name="view" value={current.view} /> : null}
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search customers</span>
            <Icon.Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input name="q" defaultValue={q} placeholder="Name, email or phone" className={`${field.input} pl-9`} />
          </label>
          <label className="grid gap-1">
            <span className="text-[0.74rem] text-faint">Sort</span>
            <AutoSubmitSelect name="sort" defaultValue={sort} className={`${field.select} w-48`}>
              {(Object.keys(CUSTOMER_SORTS) as CustomerSort[]).map((s) => (
                <option key={s} value={s}>
                  {CUSTOMER_SORTS[s].label}
                </option>
              ))}
            </AutoSubmitSelect>
          </label>
          <button type="submit" className="h-10 border border-ink px-4 text-[0.86rem] font-semibold hover:bg-ink hover:text-ground">
            Search
          </button>
          {q ? (
            <Link href={hrefWith("/admin/customers", { ...current, q: undefined })} className="px-2 py-2.5 text-[0.84rem] text-muted hover:text-live">
              Clear
            </Link>
          ) : null}
        </form>

        {rows.length === 0 ? (
          <EmptyState icon={<Icon.Customers />} title={q ? "No customers match" : "No customers here yet"}>
            {q ? "Search by any part of a name or email, or the last digits of a phone number." : "A customer appears the moment they place their first order."}
          </EmptyState>
        ) : (
          <div className={table.wrap}>
            <table className={`${table.table} min-w-[820px]`}>
              <thead>
                <tr>
                  <th className={table.th}>Customer</th>
                  <th className={table.th}>Location</th>
                  <th className={table.thRight}>Paid orders</th>
                  <th className={table.thRight}>Spent</th>
                  <th className={table.thRight}>Average</th>
                  <th className={table.th}>Last order</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.email} className={table.tr}>
                    <td className={table.td}>
                      <Link href={`/admin/customers/${encodeURIComponent(c.email)}`} className="font-semibold leading-snug hover:text-live">
                        {c.name}
                      </Link>
                      <p className="text-[0.78rem] text-faint">{c.email}</p>
                    </td>
                    <td className={`${table.td} text-[0.84rem]`}>
                      {c.city}
                      <p className="text-[0.76rem] text-faint">{c.state}</p>
                    </td>
                    <td className={table.tdRight}>
                      {formatCount(c.paidOrders)}
                      {c.orders !== c.paidOrders ? <p className="text-[0.72rem] text-faint">of {formatCount(c.orders)} placed</p> : null}
                    </td>
                    <td className={table.tdRight}>{formatNaira(c.spent)}</td>
                    <td className={`${table.tdRight} text-muted`}>{c.paidOrders ? formatNaira(Math.round(c.spent / c.paidOrders)) : "—"}</td>
                    <td className={table.td}>
                      <span className="text-[0.84rem]" title={formatDate(c.lastOrderAt)}>
                        {formatRelative(c.lastOrderAt)}
                      </span>
                      <p className="text-[0.74rem] text-faint">since {formatDate(c.firstOrderAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          noun={total === 1 ? "customer" : "customers"}
          hrefFor={(n) => hrefWith("/admin/customers", current, { page: n === 1 ? null : n })}
        />
      </div>
    </div>
  );
}
