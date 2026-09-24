import type { Metadata } from "next";
import Link from "next/link";
import { FulfilmentBadge, PaymentBadge, StockBadge } from "@/components/admin/badges";
import { TrendChart } from "@/components/admin/charts";
import { Icon } from "@/components/admin/icons";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { Thumb } from "@/components/admin/thumb";
import { EmptyState, LinkButton, Notice, PageHeader, Panel, Stat, table } from "@/components/admin/ui";
import { addDays, change, resolveRange, totalsOf, type ReportOrder } from "@/lib/admin/analytics";
import { requireAdmin } from "@/lib/admin/auth";
import { getNavCounts } from "@/lib/admin/counts";
import { formatCount, formatNairaCompact, formatRelative, lagosDay, lagosGreeting, lagosToday } from "@/lib/admin/format";
import { countOrders, recentOrders } from "@/lib/admin/orders";
import { listStockAlerts } from "@/lib/admin/products";
import { loadReport } from "@/lib/admin/reports";
import { isCatalogueImported } from "@/lib/catalogue-data";
import { formatNaira } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Overview" };

const fullDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long" });
const delta = (now: number, before: number) => {
  const value = change(now, before);
  return value == null ? null : { value };
};

/**
 * The first screen after signing in: what needs a person now, how today and
 * the month are going, and the latest of everything — each linking to where
 * the work is done.
 */
export default async function OverviewPage() {
  const admin = await requireAdmin();
  const title = `${lagosGreeting()}, ${admin.name}`;
  if (!isSupabaseConfigured()) return <NeedsDatabase title={title} />;

  const today = lagosToday();
  const range = resolveRange({ range: "30d" }, today);
  // unpaid checkouts pile up over months; the ones worth a call are this week's
  const weekStart = addDays(today, -6);
  const [{ report, orders }, nav, awaiting, recent, alerts, imported] = await Promise.all([
    loadReport(range, 5),
    getNavCounts(),
    countOrders("awaiting", { from: weekStart }),
    recentOrders(8),
    listStockAlerts(6),
    isCatalogueImported(),
  ]);

  // today and the last week, from the same 60 days of orders the report read
  const within = (from: string, to: string): ReportOrder[] =>
    orders.filter((o) => {
      const day = lagosDay(o.createdAt);
      return day >= from && day <= to;
    });
  const none = new Map<string, string>();
  const yesterday = addDays(today, -1);
  const day = totalsOf(within(today, today), none, today);
  const dayBefore = totalsOf(within(yesterday, yesterday), none, yesterday);
  const week = totalsOf(within(addDays(today, -6), today), none, today);
  const weekBefore = totalsOf(within(addDays(today, -13), addDays(today, -7)), none, today);
  const month = report.totals;

  const todo = [
    { n: nav.toFulfil, label: "To pack", note: "paid and waiting to go out", href: "/admin/orders?view=to-pack", bar: nav.toFulfil ? "border-l-gold" : "border-l-line" },
    { n: nav.attention, label: "Needs a look", note: "paid the wrong amount", href: "/admin/orders?view=attention", bar: nav.attention ? "border-l-warn" : "border-l-line" },
    { n: awaiting, label: "Awaiting payment", note: "placed this week, not paid", href: `/admin/orders?view=awaiting&from=${weekStart}`, bar: "border-l-line" },
    { n: nav.lowStock, label: "Low or out of stock", note: "lines to restock", href: "/admin/stock", bar: nav.lowStock ? "border-l-warn" : "border-l-line" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title={title}
        description={`${fullDate.format(new Date(`${today}T12:00:00+01:00`))}. Here is the shop at a glance.`}
        actions={
          <>
            <LinkButton href="/" target="_blank">
              <Icon.Shop className="size-4" /> View the shop
            </LinkButton>
            <LinkButton href="/admin/products/new" variant="primary">
              <Icon.Plus className="size-4" /> Add a product
            </LinkButton>
          </>
        }
      />

      {!imported ? (
        <Notice
          title="The shop is still running on the bundled catalogue."
          action={
            <LinkButton href="/admin/products" size="sm" variant="primary">
              Import it
            </LinkButton>
          }
        >
          Import it once to edit products, prices and stock from here.
        </Notice>
      ) : null}

      <nav aria-label="Waiting on you" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {todo.map((t) => (
          <Link key={t.label} href={t.href} className={`group border border-line border-l-4 ${t.bar} bg-raised px-4 py-3.5 transition-colors hover:border-ink`}>
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[0.86rem] font-semibold">{t.label}</span>
              <span className={`font-display text-[1.5rem] leading-none ${t.n ? "" : "text-faint"}`}>{formatCount(t.n)}</span>
            </span>
            <span className="mt-1 block text-[0.76rem] text-faint group-hover:text-muted">{t.note} →</span>
          </Link>
        ))}
      </nav>

      <Panel title="Sales">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4">
          <Stat label="Today" value={formatNaira(day.revenue)} delta={delta(day.revenue, dayBefore.revenue)} note={`${formatCount(day.orders)} paid · yesterday ${formatNairaCompact(dayBefore.revenue)}`} />
          <Stat
            label="Last 7 days"
            value={formatNaira(week.revenue)}
            delta={delta(week.revenue, weekBefore.revenue)}
            note={`${formatCount(week.orders)} paid orders`}
            trend={report.series.slice(-7).map((s) => s.revenue)}
          />
          <Stat
            label="Last 30 days"
            value={formatNaira(month.revenue)}
            delta={delta(month.revenue, report.previous.revenue)}
            note={`${formatCount(month.orders)} paid orders`}
            trend={report.series.map((s) => s.revenue)}
          />
          <Stat
            label="Average order, 30 days"
            value={formatNaira(month.averageOrder)}
            delta={month.orders && report.previous.orders ? delta(month.averageOrder, report.previous.averageOrder) : null}
            note={`${formatCount(month.customers)} customers`}
          />
        </div>
        <p className="mt-5 text-[0.76rem] text-faint">Changes compare each figure with the same stretch just before it. Revenue counts paid orders that were not cancelled.</p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Revenue, last 30 days" aside={<Link href="/admin/analytics" className="text-[0.78rem] font-semibold text-muted hover:text-live">Analytics →</Link>}>
          <TrendChart
            unit="naira"
            name="Last 30 days"
            previousName="The 30 days before"
            height={240}
            points={report.series.map((s) => ({ label: s.label, tip: s.tip, value: s.revenue, previous: s.previousRevenue }))}
            label={`Revenue by day for the last 30 days: ${formatNaira(month.revenue)} in all`}
            empty="No paid orders in the last 30 days."
          />
        </Panel>
        <Panel title="Best sellers, 30 days" flush>
          {report.products.length ? (
            <ol>
              {report.products.map((l, i) => (
                <li key={l.key} className="flex items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-b-0 sm:px-5">
                  <span className="w-4 font-mono text-[0.76rem] text-faint">{i + 1}</span>
                  <Thumb src={l.image ?? undefined} alt="" size={36} />
                  <div className="min-w-0 flex-1">
                    {l.id ? (
                      <Link href={`/admin/products/${l.id}`} className="line-clamp-1 text-[0.88rem] font-semibold hover:text-live">
                        {l.name}
                      </Link>
                    ) : (
                      <span className="line-clamp-1 text-[0.88rem] font-semibold">{l.name}</span>
                    )}
                    <p className="text-[0.76rem] text-faint">{formatCount(l.units)} sold</p>
                  </div>
                  <span className="font-mono text-[0.82rem] tabular-nums">{formatNairaCompact(l.revenue)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-5 py-10 text-center text-[0.86rem] text-faint">Nothing sold in the last 30 days.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Latest orders" aside={<Link href="/admin/orders" className="text-[0.78rem] font-semibold text-muted hover:text-live">All orders →</Link>} flush>
          {recent.length ? (
            <div className={table.wrap}>
              <table className={`${table.table} min-w-[640px]`}>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.reference} className={table.tr}>
                      <td className={table.td}>
                        <Link href={`/admin/orders/${o.reference}`} className="whitespace-nowrap font-mono text-[0.84rem] font-semibold hover:text-live">
                          {o.reference}
                        </Link>
                        <p className="text-[0.76rem] text-faint">{formatRelative(o.createdAt)}</p>
                      </td>
                      <td className={`${table.td} max-w-[220px]`}>
                        <p className="truncate font-semibold leading-snug">{o.customerName}</p>
                        <p className="text-[0.76rem] text-faint">{o.state}</p>
                      </td>
                      <td className={table.tdRight}>{formatNaira(o.total)}</td>
                      <td className={table.td}>
                        <div className="flex flex-col items-start gap-1">
                          <PaymentBadge status={o.status} />
                          <FulfilmentBadge fulfilment={o.fulfilment} paid={o.status === "paid"} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<Icon.Orders />} title="No orders yet">
              They appear here the moment a customer checks out.
            </EmptyState>
          )}
        </Panel>
        <Panel title="Running low" aside={<Link href="/admin/stock" className="text-[0.78rem] font-semibold text-muted hover:text-live">Stock →</Link>} flush>
          {alerts.length ? (
            <ul>
              {alerts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-b-0 sm:px-5">
                  <Thumb src={p.images[0]} alt="" size={36} />
                  <Link href={`/admin/products/${p.id}`} className="line-clamp-2 min-w-0 flex-1 text-[0.86rem] font-semibold leading-snug hover:text-live">
                    {p.name}
                  </Link>
                  <StockBadge state={p.stockState} stock={p.stock} inStock={p.inStock} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-[0.86rem] text-faint">Every counted line is above its alert level.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
