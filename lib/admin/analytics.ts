import type { Fulfilment, PaymentStatus } from "@/components/admin/badges";
import { lagosDay, lagosWeekdayHour } from "@/lib/admin/format";
import { getCategory } from "@/lib/catalogue";

/**
 * The arithmetic behind the admin's reports: pure functions over plain order
 * rows, so every number on the Overview and Analytics pages can be checked
 * without a database or a browser. Loading the rows is lib/admin/reports.ts.
 *
 * Two rules hold everywhere:
 *  - An order is dated by when it was placed, on the Lagos calendar.
 *  - Revenue is money kept: paid orders that were not cancelled. A refund or
 *    a cancellation takes an order out; an amount mismatch comes in once
 *    someone accepts the payment.
 */

// ------------------------------------------------------------ calendar days

const DAY_MS = 86_400_000;

/** A calendar day, "2026-09-24", moved by n days. */
export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from a to b: "2026-09-01" to "2026-09-03" is 2. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

export function isDay(v: string | null | undefined): v is string {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === v;
}

// A calendar day is formatted as the UTC date it names, so "2026-09-24" reads
// as the 24th whatever zone the server runs in.
const utc = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o });
const fDayMonth = utc({ day: "numeric", month: "short" });
const fDayMonthYear = utc({ day: "numeric", month: "short", year: "numeric" });
const fWeekday = utc({ weekday: "short", day: "numeric", month: "short" });
const fMonth = utc({ month: "short" });
const fMonthYear = utc({ month: "short", year: "numeric" });
const fMonthLong = utc({ month: "long" });
const at = (day: string) => new Date(`${day}T00:00:00Z`);

/** "3 Sept", "3–9 Sept", "28 Aug – 3 Sept", "28 Dec 2025 – 3 Jan 2026". */
export function formatDaySpan(from: string, to: string): string {
  if (from === to) return fDayMonth.format(at(from));
  if (from.slice(0, 4) !== to.slice(0, 4)) return `${fDayMonthYear.format(at(from))} – ${fDayMonthYear.format(at(to))}`;
  if (from.slice(0, 7) === to.slice(0, 7)) return `${Number(from.slice(8))}–${fDayMonth.format(at(to))}`;
  return `${fDayMonth.format(at(from))} – ${fDayMonth.format(at(to))}`;
}

const lastOfMonth = (day: string) => {
  const d = at(day);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
};

// ------------------------------------------------------------------- ranges

export const RANGE_PRESETS = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
  mtd: "Month to date",
  ytd: "Year to date",
} as const;
export type RangePreset = keyof typeof RANGE_PRESETS;
export type RangeKey = RangePreset | "custom";
export type Bucket = "day" | "week" | "month";

export type ReportRange = {
  key: RangeKey;
  /** Inclusive Lagos days. */
  from: string;
  to: string;
  days: number;
  label: string;
  /** "26 Aug – 24 Sept" */
  span: string;
  /** The stretch it is compared with, and how to say so: "the 30 days before". */
  previous: { from: string; to: string; label: string };
  bucket: Bucket;
};

/** Two years is plenty for a shop this size, and keeps a custom range from loading everything. */
export const MAX_RANGE_DAYS = 731;

export function resolveRange(input: { range?: string; from?: string; to?: string }, today: string): ReportRange {
  let key: RangeKey = input.range && input.range in RANGE_PRESETS ? (input.range as RangePreset) : "30d";
  let from: string;
  let to = today;

  if (isDay(input.from) && isDay(input.to)) {
    key = "custom";
    [from, to] = input.from <= input.to ? [input.from, input.to] : [input.to, input.from];
    if (to > today) to = today;
    if (from > to) from = to;
    if (daysBetween(from, to) + 1 > MAX_RANGE_DAYS) from = addDays(to, -(MAX_RANGE_DAYS - 1));
  } else if (key === "mtd") {
    from = `${today.slice(0, 7)}-01`;
  } else if (key === "ytd") {
    from = `${today.slice(0, 4)}-01-01`;
  } else if (key === "12m") {
    const d = at(today);
    from = addDays(new Date(Date.UTC(d.getUTCFullYear() - 1, d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10), 1);
  } else {
    from = addDays(today, -({ "7d": 7, "30d": 30, "90d": 90 }[key as "7d" | "30d" | "90d"] - 1));
  }

  const days = daysBetween(from, to) + 1;
  let previous: ReportRange["previous"];
  if (key === "mtd") {
    // the same days of last month, so a 24-day month-to-date meets 24 days, not 31
    const start = `${addDays(from, -1).slice(0, 7)}-01`;
    const end = addDays(start, days - 1);
    previous = { from: start, to: end > lastOfMonth(start) ? lastOfMonth(start) : end, label: `the same days of ${fMonthLong.format(at(start))}` };
  } else if (key === "ytd") {
    const start = `${Number(from.slice(0, 4)) - 1}-01-01`;
    previous = { from: start, to: addDays(start, days - 1), label: `the same days of ${start.slice(0, 4)}` };
  } else {
    const end = addDays(from, -1);
    previous = { from: addDays(end, -(days - 1)), to: end, label: key === "12m" ? "the 12 months before" : `the ${days === 1 ? "day" : `${days} days`} before` };
  }

  return {
    key,
    from,
    to,
    days,
    label: key === "custom" ? formatDaySpan(from, to) : RANGE_PRESETS[key],
    span: formatDaySpan(from, to),
    previous,
    bucket: days <= 45 ? "day" : days <= 200 ? "week" : "month",
  };
}

// ------------------------------------------------------------------ buckets

export type BucketDef = { start: string; end: string; label: string; tip: string };

/** The chart's x positions: days, Monday weeks or calendar months, clipped to the range. */
export function makeBuckets(from: string, to: string, unit: Bucket): BucketDef[] {
  const out: BucketDef[] = [];
  const crossesYears = from.slice(0, 4) !== to.slice(0, 4);
  for (let start = from; start <= to; ) {
    let end =
      unit === "day" ? start : unit === "week" ? addDays(start, 6 - ((at(start).getUTCDay() + 6) % 7)) : lastOfMonth(start);
    if (end > to) end = to;
    let label: string, tip: string;
    if (unit === "day") {
      label = fDayMonth.format(at(start));
      tip = fWeekday.format(at(start));
    } else if (unit === "week") {
      label = fDayMonth.format(at(start));
      tip = formatDaySpan(start, end);
    } else {
      const whole = start.endsWith("-01") && end === lastOfMonth(start);
      label = crossesYears && (out.length === 0 || start.slice(5, 7) === "01") ? fMonthYear.format(at(start)) : fMonth.format(at(start));
      tip = whole ? fMonthYear.format(at(start)) : formatDaySpan(start, end);
    }
    out.push({ start, end, label, tip });
    start = addDays(end, 1);
  }
  return out;
}

function bucketIndexer(buckets: BucketDef[]): (day: string) => number {
  const index = new Map<string, number>();
  buckets.forEach((b, i) => {
    for (let d = b.start; d <= b.end; d = addDays(d, 1)) index.set(d, i);
  });
  return (day) => index.get(day) ?? -1;
}

// ------------------------------------------------------------------- orders

export type ReportLine = { productId?: string; slug: string; name: string; image?: string; qty: number; lineTotal: number };

export type ReportOrder = {
  reference: string;
  status: PaymentStatus;
  fulfilment: Fulfilment;
  customerName: string;
  customerEmail: string;
  city: string;
  state: string;
  items: ReportLine[];
  subtotal: number;
  delivery: number;
  total: number;
  paidChannel: string | null;
  createdAt: string;
};

export type ReportProduct = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  categories: string[];
  stock: number | null;
  status: string;
};

/** Money kept: paid, and not cancelled since. */
export const isSale = (o: Pick<ReportOrder, "status" | "fulfilment">) => o.status === "paid" && o.fulfilment !== "cancelled";
/** The customer paid in full at some point, even if it was later refunded. */
export const wasPaid = (o: Pick<ReportOrder, "status">) => o.status === "paid" || o.status === "refunded";

const units = (o: ReportOrder) => o.items.reduce((n, i) => n + (Number(i.qty) || 0), 0);
const emailKey = (email: string) => email.trim().toLowerCase();

export type Totals = {
  /** Orders placed, whatever became of them. */
  placed: number;
  /** Orders that are sales: paid and not cancelled. */
  orders: number;
  revenue: number;
  productRevenue: number;
  deliveryRevenue: number;
  units: number;
  averageOrder: number;
  /** Share of placed orders that were paid for. */
  paidRate: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  refunded: number;
  refundedValue: number;
  cancelled: number;
};

/**
 * The headline numbers for a set of orders. `firstOrderDay` says when each
 * customer (by lower-case email) first ordered at all; a customer is new if
 * that falls on or after `from`.
 */
export function totalsOf(orders: ReportOrder[], firstOrderDay: Map<string, string>, from: string): Totals {
  let revenue = 0, productRevenue = 0, deliveryRevenue = 0, sold = 0, sales = 0, paid = 0;
  let refunded = 0, refundedValue = 0, cancelled = 0;
  const buyers = new Set<string>();
  for (const o of orders) {
    if (wasPaid(o)) paid++;
    if (o.status === "refunded") {
      refunded++;
      refundedValue += o.total;
    }
    if (o.fulfilment === "cancelled") cancelled++;
    if (!isSale(o)) continue;
    sales++;
    revenue += o.total;
    productRevenue += o.subtotal;
    deliveryRevenue += o.delivery;
    sold += units(o);
    buyers.add(emailKey(o.customerEmail));
  }
  let fresh = 0;
  for (const email of buyers) if ((firstOrderDay.get(email) ?? from) >= from) fresh++;
  return {
    placed: orders.length,
    orders: sales,
    revenue,
    productRevenue,
    deliveryRevenue,
    units: sold,
    averageOrder: sales ? Math.round(revenue / sales) : 0,
    paidRate: orders.length ? paid / orders.length : 0,
    customers: buyers.size,
    newCustomers: fresh,
    returningCustomers: buyers.size - fresh,
    refunded,
    refundedValue,
    cancelled,
  };
}

/** Relative change, or null when there is nothing to compare with. */
export function change(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

// ------------------------------------------------------------------- report

export type SeriesPoint = {
  label: string;
  tip: string;
  revenue: number;
  /** The same stretch of days one period earlier, lined up day by day. */
  previousRevenue: number;
  placed: number;
  orders: number;
  units: number;
};

export type ProductLine = {
  key: string;
  id: string | null;
  name: string;
  image: string | null;
  units: number;
  revenue: number;
  orders: number;
  share: number;
  stock: number | null;
  /** Days until the shelf is empty at this period's pace; null when not counted or not selling. */
  daysLeft: number | null;
  status: string | null;
};

export type ShareLine = { key: string; name: string; value: number; count: number; share: number; note?: string };

export type CustomerLine = { email: string; name: string; orders: number; revenue: number; isNew: boolean };

export type Pipeline = {
  placed: number;
  paid: number;
  shipped: number;
  delivered: number;
  awaiting: number;
  failed: number;
  mismatch: number;
  cancelled: number;
  refunded: number;
};

export type Report = {
  range: ReportRange;
  totals: Totals;
  previous: Totals;
  series: SeriesPoint[];
  products: ProductLine[];
  categories: ShareLine[];
  states: ShareLine[];
  channels: ShareLine[];
  customers: CustomerLine[];
  /** Orders placed, [Monday..Sunday][hour 0..23], Lagos time. */
  heatmap: number[][];
  pipeline: Pipeline;
};

const CHANNELS: Record<string, { name: string; online: boolean }> = {
  card: { name: "Card", online: true },
  bank: { name: "Bank account", online: true },
  bank_transfer: { name: "Transfer via Paystack", online: true },
  ussd: { name: "USSD", online: true },
  qr: { name: "QR", online: true },
  mobile_money: { name: "Mobile money", online: true },
  apple_pay: { name: "Apple Pay", online: true },
  transfer: { name: "Bank transfer", online: false },
  cash: { name: "Cash", online: false },
  pos: { name: "POS", online: false },
  other: { name: "Other", online: false },
  manual: { name: "Recorded by hand", online: false },
};

export function channelName(channel: string | null): { name: string; online: boolean } {
  return CHANNELS[channel ?? ""] ?? { name: channel ? channel.replace(/_/g, " ") : "Not recorded", online: true };
}

/** The top `keep` lines by value, the rest folded into one. */
function fold(lines: ShareLine[], keep: number, otherName: string): ShareLine[] {
  const sorted = [...lines].sort((a, b) => b.value - a.value || b.count - a.count || a.name.localeCompare(b.name));
  if (sorted.length <= keep + 1) return sorted;
  const rest = sorted.slice(keep);
  return [
    ...sorted.slice(0, keep),
    {
      key: "other",
      name: otherName,
      value: rest.reduce((n, l) => n + l.value, 0),
      count: rest.reduce((n, l) => n + l.count, 0),
      share: rest.reduce((n, l) => n + l.share, 0),
      note: `${rest.length} more`,
    },
  ];
}

function shareLines(map: Map<string, { name: string; value: number; count: number; note?: string }>, whole: number): ShareLine[] {
  return [...map.entries()].map(([key, v]) => ({ key, ...v, share: whole ? v.value / whole : 0 }));
}

/**
 * Everything the Analytics page draws, for one range. `orders` holds the
 * current and the previous period together — they are told apart by day.
 */
export function buildReport(input: {
  range: ReportRange;
  orders: ReportOrder[];
  products: ReportProduct[];
  firstOrderDay: Map<string, string>;
  topProducts?: number;
}): Report {
  const { range, products, firstOrderDay } = input;
  const dated = input.orders.map((o) => ({ o, day: lagosDay(o.createdAt) }));
  const current = dated.filter((d) => d.day >= range.from && d.day <= range.to);
  const before = dated.filter((d) => d.day >= range.previous.from && d.day <= range.previous.to);
  const currentOrders = current.map((d) => d.o);
  const totals = totalsOf(currentOrders, firstOrderDay, range.from);
  const previous = totalsOf(
    before.map((d) => d.o),
    firstOrderDay,
    range.previous.from,
  );

  // over time
  const buckets = makeBuckets(range.from, range.to, range.bucket);
  const bucketOf = bucketIndexer(buckets);
  const series: SeriesPoint[] = buckets.map((b) => ({ label: b.label, tip: b.tip, revenue: 0, previousRevenue: 0, placed: 0, orders: 0, units: 0 }));
  for (const { o, day } of current) {
    const p = series[bucketOf(day)];
    if (!p) continue;
    p.placed++;
    if (!isSale(o)) continue;
    p.orders++;
    p.revenue += o.total;
    p.units += units(o);
  }
  for (const { o, day } of before) {
    if (!isSale(o)) continue;
    const aligned = addDays(range.from, daysBetween(range.previous.from, day));
    const p = aligned <= range.to ? series[bucketOf(aligned)] : undefined;
    if (p) p.previousRevenue += o.total;
  }

  // products and aisles, from the lines of this period's sales
  const byId = new Map(products.map((p) => [p.id, p]));
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const lines = new Map<string, ProductLine & { refs: Set<string> }>();
  const aisles = new Map<string, { name: string; value: number; count: number }>();
  for (const o of currentOrders) {
    if (!isSale(o)) continue;
    for (const line of o.items) {
      const product = (line.productId ? byId.get(line.productId) : undefined) ?? bySlug.get(line.slug);
      const key = product?.id ?? `slug:${line.slug}`;
      const qty = Number(line.qty) || 0;
      const value = Number(line.lineTotal) || 0;
      let row = lines.get(key);
      if (!row) {
        row = {
          key,
          id: product?.id ?? null,
          name: product?.name ?? line.name,
          image: product?.image ?? line.image ?? null,
          units: 0,
          revenue: 0,
          orders: 0,
          share: 0,
          stock: product?.stock ?? null,
          daysLeft: null,
          status: product?.status ?? null,
          refs: new Set(),
        };
        lines.set(key, row);
      }
      row.units += qty;
      row.revenue += value;
      row.refs.add(o.reference);

      const slug = product?.categories[0] ?? "";
      const aisle = getCategory(slug);
      const aisleKey = aisle ? slug : "unlisted";
      const a = aisles.get(aisleKey) ?? { name: aisle?.name ?? "No longer listed", value: 0, count: 0 };
      a.value += value;
      a.count += qty;
      aisles.set(aisleKey, a);
    }
  }
  const productRows: ProductLine[] = [...lines.values()]
    .map(({ refs, ...row }) => {
      const pace = row.units / range.days;
      return {
        ...row,
        orders: refs.size,
        share: totals.productRevenue ? row.revenue / totals.productRevenue : 0,
        daysLeft: row.stock == null || pace === 0 ? null : Math.max(0, Math.floor(row.stock / pace)),
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units || a.name.localeCompare(b.name))
    .slice(0, input.topProducts ?? 10);

  // places, channels, customers, hours
  const places = new Map<string, { name: string; value: number; count: number }>();
  const channels = new Map<string, { name: string; value: number; count: number; note?: string }>();
  const buyers = new Map<string, CustomerLine & { at: string }>();
  const heatmap = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const pipeline: Pipeline = { placed: 0, paid: 0, shipped: 0, delivered: 0, awaiting: 0, failed: 0, mismatch: 0, cancelled: 0, refunded: 0 };

  for (const o of currentOrders) {
    const { weekday, hour } = lagosWeekdayHour(o.createdAt);
    heatmap[weekday][hour]++;

    pipeline.placed++;
    if (wasPaid(o)) pipeline.paid++;
    if (o.fulfilment === "shipped" || o.fulfilment === "delivered") pipeline.shipped++;
    if (o.fulfilment === "delivered") pipeline.delivered++;
    if (o.fulfilment === "cancelled") pipeline.cancelled++;
    else if (o.status === "pending") pipeline.awaiting++;
    else if (o.status === "failed") pipeline.failed++;
    else if (o.status === "mismatch") pipeline.mismatch++;
    if (o.status === "refunded") pipeline.refunded++;

    if (!isSale(o)) continue;
    const stateName = o.state.trim() || "Not given";
    const place = places.get(stateName) ?? { name: stateName, value: 0, count: 0 };
    place.value += o.total;
    place.count++;
    places.set(stateName, place);

    const ch = channelName(o.paidChannel);
    const c = channels.get(ch.name) ?? { name: ch.name, value: 0, count: 0, note: ch.online ? "Online" : "At the counter" };
    c.value += o.total;
    c.count++;
    channels.set(ch.name, c);

    const email = emailKey(o.customerEmail);
    const b = buyers.get(email) ?? { email, name: o.customerName, orders: 0, revenue: 0, isNew: (firstOrderDay.get(email) ?? range.from) >= range.from, at: o.createdAt };
    b.orders++;
    b.revenue += o.total;
    if (o.createdAt >= b.at) {
      b.name = o.customerName; // the name they used most recently
      b.at = o.createdAt;
    }
    buyers.set(email, b);
  }

  return {
    range,
    totals,
    previous,
    series,
    products: productRows,
    categories: fold(shareLines(aisles, totals.productRevenue), 7, "Other aisles"),
    states: fold(shareLines(places, totals.revenue), 7, "Other states"),
    channels: fold(shareLines(channels, totals.revenue), 5, "Other ways"),
    customers: [...buyers.values()]
      .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
      .slice(0, 8)
      .map((c) => ({ email: c.email, name: c.name, orders: c.orders, revenue: c.revenue, isNew: c.isNew })),
    heatmap,
    pipeline,
  };
}

/** One row per day, for the download: what a bookkeeper reconciles against the bank. */
export function dailyRows(range: Pick<ReportRange, "from" | "to">, orders: ReportOrder[]) {
  const rows = new Map<string, { day: string; placed: number; orders: number; units: number; revenue: number; delivery: number }>();
  for (let d = range.from; d <= range.to; d = addDays(d, 1)) rows.set(d, { day: d, placed: 0, orders: 0, units: 0, revenue: 0, delivery: 0 });
  for (const o of orders) {
    const row = rows.get(lagosDay(o.createdAt));
    if (!row) continue;
    row.placed++;
    if (!isSale(o)) continue;
    row.orders++;
    row.units += units(o);
    row.revenue += o.total;
    row.delivery += o.delivery;
  }
  return [...rows.values()];
}
