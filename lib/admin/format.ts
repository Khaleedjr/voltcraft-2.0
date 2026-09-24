/**
 * How the admin writes dates and numbers.
 *
 * Every date is shown — and every day is bucketed — in Lagos time. The shop
 * runs on West Africa Time, and a server in another zone would otherwise put
 * an order paid at 11:30 pm into the next day's takings.
 */

export const SHOP_TZ = "Africa/Lagos";

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHOP_TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: SHOP_TZ, day: "numeric", month: "short", year: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: SHOP_TZ, day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: SHOP_TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: SHOP_TZ,
  weekday: "short",
  hour: "numeric",
  hour12: false,
});
const countFmt = new Intl.NumberFormat("en-NG");
const compactNaira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  notation: "compact",
  minimumFractionDigits: 0, // currency style would otherwise force "₦15.0K"
  maximumFractionDigits: 1,
});

export function formatDateTime(iso: string | null | undefined): string {
  return iso ? dateTimeFmt.format(new Date(iso)) : "—";
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? dateFmt.format(new Date(iso)) : "—";
}

export function formatShortDate(iso: string | Date): string {
  return shortDateFmt.format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** Midnight at the start of a Lagos day, as an instant. Lagos is UTC+1 all year. */
export function lagosDayStart(day: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const t = Date.parse(`${day}T00:00:00+01:00`);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** "2026-09-24" — the Lagos calendar day an instant falls on. */
export function lagosDay(date: Date | string): string {
  return dayKeyFmt.format(typeof date === "string" ? new Date(date) : date);
}

/** Today, on the Lagos calendar. A function, so a page reads the clock per request. */
export function lagosToday(): string {
  return lagosDay(new Date());
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Lagos weekday (0 = Monday) and hour (0–23) of an instant. */
export function lagosWeekdayHour(date: Date | string): { weekday: number; hour: number } {
  const parts = partsFmt.formatToParts(typeof date === "string" ? new Date(date) : date);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  return { weekday: Math.max(0, WEEKDAYS.indexOf(wd as (typeof WEEKDAYS)[number])), hour };
}

export { WEEKDAYS };

/** "Good morning" and so on, by the hour in Lagos. */
export function lagosGreeting(date = new Date()): string {
  const { hour } = lagosWeekdayHour(date);
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export function formatCount(n: number): string {
  return countFmt.format(n);
}

/** ₦1.2M, ₦845K — for chart axes and tight tiles. */
export function formatNairaCompact(n: number): string {
  return compactNaira.format(n);
}

export function formatPercent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** "4 min ago", "3 h ago", "yesterday", else the date. Server-rendered only. */
export function formatRelative(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const s = Math.round((now - then) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  // past a day, count calendar days in Lagos: 30 hours ago can be two days back
  const d = Math.round((Date.parse(lagosDay(new Date(now))) - Date.parse(lagosDay(new Date(then)))) / 86_400_000);
  if (d <= 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return formatDate(iso);
}
