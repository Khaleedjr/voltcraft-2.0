import type { Metadata } from "next";
import Link from "next/link";
import { ColumnChart, HeatGrid, TrendChart } from "@/components/admin/charts";
import { BarList, Meter, Pipeline } from "@/components/admin/figures";
import { Icon } from "@/components/admin/icons";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { RangeFilter, ReportFrame } from "@/components/admin/range-filter";
import { Thumb } from "@/components/admin/thumb";
import { Badge, LinkButton, PageHeader, Panel, Stat, table } from "@/components/admin/ui";
import { change, formatDaySpan, RANGE_PRESETS, resolveRange, type RangePreset, type Report } from "@/lib/admin/analytics";
import { requireAdmin } from "@/lib/admin/auth";
import { getNavCounts } from "@/lib/admin/counts";
import { formatCount, formatNairaCompact, formatPercent, lagosToday, WEEKDAYS } from "@/lib/admin/format";
import { inventoryValue } from "@/lib/admin/products";
import { loadReport } from "@/lib/admin/reports";
import { hrefWith, param } from "@/lib/admin/url";
import { formatNaira } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Analytics" };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n: number, one: string, many = `${one}s`) => `${formatCount(n)} ${n === 1 ? one : many}`;
const BUCKET_WORD = { day: "Daily", week: "Weekly, Monday to Sunday", month: "Monthly" } as const;
const delta = (now: number, before: number, goodWhenUp = true) => {
  const value = change(now, before);
  return value == null ? null : { value, goodWhenUp };
};

/** The busiest weekday-and-hour, in words. */
function busiest(heatmap: number[][]): string | null {
  let best = { v: 0, d: 0, h: 0 };
  heatmap.forEach((row, d) =>
    row.forEach((v, h) => {
      if (v > best.v) best = { v, d, h };
    }),
  );
  if (!best.v) return null;
  const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return `Busiest: ${WEEKDAYS[best.d]} ${hh(best.h)}–${hh((best.h + 1) % 24)}, ${plural(best.v, "order")}`;
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return <NeedsDatabase title="Analytics" />;

  const sp = await searchParams;
  const today = lagosToday();
  const range = resolveRange({ range: param(sp.range), from: param(sp.from), to: param(sp.to) }, today);
  const [{ report }, stock, counts] = await Promise.all([loadReport(range, 10), inventoryValue(), getNavCounts()]);
  const { totals: t, previous: p, series, pipeline } = report;

  const current: Record<string, string | undefined> =
    range.key === "custom" ? { from: range.from, to: range.to } : { range: range.key === "30d" ? undefined : range.key };
  const presets = (Object.keys(RANGE_PRESETS) as RangePreset[]).map((key) => ({
    key,
    label: RANGE_PRESETS[key],
    href: hrefWith("/admin/analytics", {}, { range: key === "30d" ? null : key }),
  }));
  const compared = `${range.previous.label} (${formatDaySpan(range.previous.from, range.previous.to)})`;
  const sellingOut = report.products.filter((l) => l.daysLeft != null && l.daysLeft < 21);

  return (
    // grid-cols-1 is minmax(0, 1fr): no child can force the page wider than the screen
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Analytics"
        description={`${range.label === range.span ? range.span : `${range.label}, ${range.span}`}. Orders are dated by when they were placed, in Lagos time; revenue counts paid orders that were not cancelled or refunded.`}
        actions={
          <LinkButton href={hrefWith("/admin/analytics/export", current)} prefetch={false}>
            <Icon.Download className="size-4" /> Daily figures (CSV)
          </LinkButton>
        }
      />

      <ReportFrame
        controls={<RangeFilter path="/admin/analytics" presets={presets} active={range.key} from={range.from} to={range.to} today={today} />}
      >
        <Panel title="The period at a glance" aside={<span className="text-right text-[0.76rem] text-faint">Changes against {compared}</span>}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-3 xl:grid-cols-6">
            <Stat
              label="Revenue"
              value={formatNaira(t.revenue)}
              delta={delta(t.revenue, p.revenue)}
              note={p.revenue ? `from ${formatNairaCompact(p.revenue)}` : "none before"}
              trend={series.map((s) => s.revenue)}
            />
            <Stat
              label="Paid orders"
              value={formatCount(t.orders)}
              delta={delta(t.orders, p.orders)}
              note={`of ${formatCount(t.placed)} placed`}
              trend={series.map((s) => s.orders)}
            />
            <Stat
              label="Average order"
              value={formatNaira(t.averageOrder)}
              delta={t.orders && p.orders ? delta(t.averageOrder, p.averageOrder) : null}
              note={t.orders ? `${(t.units / t.orders).toFixed(1)} items each` : "no paid orders"}
            />
            <Stat
              label="Units sold"
              value={formatCount(t.units)}
              delta={delta(t.units, p.units)}
              note={`from ${formatCount(p.units)}`}
              trend={series.map((s) => s.units)}
            />
            <Stat
              label="Customers"
              value={formatCount(t.customers)}
              delta={delta(t.customers, p.customers)}
              note={`${formatCount(t.newCustomers)} new · ${formatCount(t.returningCustomers)} back again`}
            />
            <Stat
              label="Checkouts paid"
              value={t.placed ? formatPercent(t.paidRate) : "—"}
              note={p.placed ? `was ${formatPercent(p.paidRate)}` : "of orders placed"}
            />
          </div>
        </Panel>

        <Panel title="Revenue" aside={<span className="text-[0.76rem] text-faint">{BUCKET_WORD[range.bucket]}</span>}>
          <TrendChart
            unit="naira"
            name={range.label}
            previousName={cap(range.previous.label)}
            points={series.map((s) => ({ label: s.label, tip: s.tip, value: s.revenue, previous: s.previousRevenue }))}
            label={`Revenue, ${range.span}: ${formatNaira(t.revenue)} in all, against ${formatNaira(p.revenue)} in ${range.previous.label}`}
            empty="No paid orders in this period."
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel title="Orders placed" aside={<span className="text-[0.76rem] text-faint">{BUCKET_WORD[range.bucket]}</span>}>
            <ColumnChart
              points={series.map((s) => ({ label: s.label, tip: s.tip, values: [s.orders, s.placed - s.orders] }))}
              series={[
                { name: "Paid", color: "var(--vc-chart-1)" },
                { name: "Unpaid or cancelled", color: "var(--vc-chart-context)" },
              ]}
              totalName="placed"
              label={`Orders placed, ${range.span}: ${formatCount(t.placed)}, of which ${formatCount(t.orders)} paid`}
              empty="No orders in this period."
            />
          </Panel>
          <Panel title="Where the period's orders are now">
            <Pipeline
              stages={[
                { name: "Placed", value: pipeline.placed },
                { name: "Paid", value: pipeline.paid, hint: "Paid in full, including any refunded since" },
                { name: "Shipped", value: pipeline.shipped, hint: "Shipped or delivered" },
                { name: "Delivered", value: pipeline.delivered },
              ]}
              notes={<PipelineNotes pipeline={pipeline} />}
            />
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel title="Best sellers" aside={<span className="text-[0.76rem] text-faint">By revenue</span>} flush>
            <TopProducts report={report} />
          </Panel>
          <Panel title="Aisles" aside={<span className="text-[0.76rem] text-faint">Product revenue</span>}>
            <BarList
              lines={report.categories.map((c) => ({
                key: c.key,
                name: c.name,
                value: c.value,
                count: plural(c.count, "unit"),
                share: c.share,
                context: c.key === "other" || c.key === "unlisted",
              }))}
              empty="Nothing sold in this period."
            />
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Top customers" flush>
            {report.customers.length ? (
              <ol>
                {report.customers.map((c, i) => (
                  <li key={c.email} className="flex items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-b-0 sm:px-5">
                    <span className="w-4 font-mono text-[0.76rem] text-faint">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/customers/${encodeURIComponent(c.email)}`} className="block truncate text-[0.88rem] font-semibold hover:text-live">
                        {c.name}
                      </Link>
                      <p className="text-[0.76rem] text-faint">
                        {plural(c.orders, "order")}
                        {c.isNew ? " · first time" : ""}
                      </p>
                    </div>
                    <span className="font-mono text-[0.82rem] tabular-nums">{formatNaira(c.revenue)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 py-8 text-center text-[0.86rem] text-faint">No paying customers in this period.</p>
            )}
          </Panel>
          <Panel title="Where orders go" aside={<span className="text-[0.76rem] text-faint">By state</span>}>
            <BarList
              lines={report.states.map((s) => ({ key: s.key, name: s.name, value: s.value, count: plural(s.count, "order"), share: s.share, context: s.key === "other" }))}
              empty="No paid orders in this period."
            />
          </Panel>
          <Panel title="How customers pay">
            <BarList
              lines={report.channels.map((c) => ({
                key: c.key,
                name: c.name,
                value: c.value,
                count: plural(c.count, "order"),
                share: c.share,
                context: c.key === "other",
              }))}
              empty="No paid orders in this period."
            />
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel title="When orders come in" aside={<span className="text-[0.76rem] text-faint">{busiest(report.heatmap) ?? "Orders placed, by hour"}</span>}>
            <HeatGrid cells={report.heatmap} rows={WEEKDAYS} label={`Orders placed by weekday and hour, ${range.span}`} />
          </Panel>
          <div className="grid content-start gap-6">
            <Panel title="New and returning">
              {t.customers ? (
                <>
                  <p className="text-[0.9rem] leading-relaxed">
                    <strong className="font-semibold">{formatCount(t.returningCustomers)}</strong> of {plural(t.customers, "paying customer")} had ordered before;{" "}
                    <strong className="font-semibold">{formatCount(t.newCustomers)}</strong> {t.newCustomers === 1 ? "was" : "were"} new.
                  </p>
                  <div className="mt-3">
                    <Meter value={t.returningCustomers / t.customers} label="Share of customers who had ordered before" />
                  </div>
                  <p className="mt-2 text-[0.76rem] text-faint">{formatPercent(t.returningCustomers / t.customers)} returning</p>
                </>
              ) : (
                <p className="text-[0.86rem] text-faint">No paying customers in this period.</p>
              )}
            </Panel>
            <Panel title="Stock" aside={<Link href="/admin/stock" className="text-[0.78rem] font-semibold text-muted hover:text-live">Open stock →</Link>}>
              <dl className="grid grid-cols-2 gap-4 text-[0.84rem]">
                <div>
                  <dt className="text-faint">Shelf value</dt>
                  <dd className="mt-1 font-display text-[1.25rem] tracking-[-0.02em]">{formatNairaCompact(stock.value)}</dd>
                </div>
                <div>
                  <dt className="text-faint">Low or out</dt>
                  <dd className={`mt-1 font-display text-[1.25rem] tracking-[-0.02em] ${counts.lowStock ? "text-warn" : ""}`}>{formatCount(counts.lowStock)}</dd>
                </div>
              </dl>
              {sellingOut.length ? (
                <div className="mt-4 border-t border-line-soft pt-3">
                  <p className="text-[0.78rem] font-semibold text-muted">At this pace, gone within three weeks</p>
                  <ul className="mt-2 grid gap-1.5 text-[0.84rem]">
                    {sellingOut.slice(0, 5).map((l) => (
                      <li key={l.key} className="flex justify-between gap-3">
                        {l.id ? (
                          <Link href={`/admin/products/${l.id}`} className="min-w-0 truncate hover:text-live">
                            {l.name}
                          </Link>
                        ) : (
                          <span className="min-w-0 truncate">{l.name}</span>
                        )}
                        <span className="shrink-0 font-mono text-[0.8rem] tabular-nums text-warn">{l.daysLeft === 0 ? "out" : `~${l.daysLeft} d`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Panel>
          </div>
        </div>
      </ReportFrame>
    </div>
  );
}

function PipelineNotes({ pipeline: q }: { pipeline: Report["pipeline"] }) {
  const parts: { n: number; text: string; href: string }[] = [
    { n: q.awaiting, text: "still awaiting payment", href: "/admin/orders?view=awaiting" },
    { n: q.failed, text: "payment failed", href: "/admin/orders?view=failed" },
    { n: q.mismatch, text: "paid the wrong amount", href: "/admin/orders?view=attention" },
    { n: q.cancelled, text: q.refunded ? `cancelled, ${formatCount(q.refunded)} refunded` : "cancelled", href: "/admin/orders?view=cancelled" },
  ].filter((x) => x.n > 0);
  if (!parts.length) return q.placed ? <p>Nothing stuck: every order is paid or on its way.</p> : <p>No orders in this period.</p>;
  return (
    <ul className="grid gap-1">
      {parts.map((x) => (
        <li key={x.text}>
          <Link href={x.href} className="hover:text-live">
            <span className="font-mono tabular-nums text-ink">{formatCount(x.n)}</span> {x.text}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TopProducts({ report }: { report: Report }) {
  if (!report.products.length) return <p className="px-5 py-10 text-center text-[0.86rem] text-faint">Nothing sold in this period.</p>;
  const top = report.products[0]?.revenue ?? 0;
  return (
    <div className={table.wrap}>
      <table className={`${table.table} min-w-[620px]`}>
        <thead>
          <tr>
            <th className={table.th}>Product</th>
            <th className={table.thRight}>Units</th>
            <th className={table.thRight}>Orders</th>
            <th className={`${table.th} w-[34%]`}>Revenue</th>
            <th className={table.thRight}>On the shelf</th>
          </tr>
        </thead>
        <tbody>
          {report.products.map((l) => (
            <tr key={l.key} className={table.tr}>
              <td className={table.td}>
                <div className="flex items-center gap-3">
                  <Thumb src={l.image ?? undefined} alt="" size={36} />
                  <div className="min-w-0">
                    {l.id ? (
                      <Link href={`/admin/products/${l.id}`} className="line-clamp-2 font-semibold leading-snug hover:text-live">
                        {l.name}
                      </Link>
                    ) : (
                      <span className="line-clamp-2 font-semibold leading-snug">{l.name}</span>
                    )}
                    {l.status && l.status !== "active" ? (
                      <Badge tone="muted">{l.status === "draft" ? "Draft" : "In trash"}</Badge>
                    ) : !l.id ? (
                      <span className="text-[0.74rem] text-faint">No longer listed</span>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className={table.tdRight}>{formatCount(l.units)}</td>
              <td className={table.tdRight}>{formatCount(l.orders)}</td>
              <td className={table.td}>
                <div className="flex items-center gap-3">
                  <span className="h-2 flex-1">
                    <span className="block h-2 rounded-r-[4px] bg-[var(--vc-chart-1)]" style={{ width: `${Math.max(1, top ? (l.revenue / top) * 100 : 0)}%` }} />
                  </span>
                  <span className="w-[6.5rem] text-right font-mono text-[0.82rem] tabular-nums">{formatNaira(l.revenue)}</span>
                </div>
              </td>
              <td className={table.tdRight}>
                {l.stock == null ? (
                  <span className="whitespace-nowrap text-faint">Not counted</span>
                ) : (
                  <>
                    {formatCount(Math.max(0, l.stock))}
                    {l.daysLeft != null ? (
                      <p className={`whitespace-nowrap text-[0.72rem] ${l.daysLeft < 14 ? "text-warn" : "text-faint"}`}>
                        {l.daysLeft === 0 ? "out now" : `~${formatCount(l.daysLeft)} days left`}
                      </p>
                    ) : null}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
