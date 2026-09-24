import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Sparkline } from "@/components/admin/figures";

/**
 * The admin's building blocks. Same tokens, type and square corners as the
 * shop — a denser ledger version of it: hairline-ruled tables, mono figures,
 * gold for the one action that matters on a screen, green for done, red for
 * whatever needs a person.
 */

// --------------------------------------------------------------------- layout

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-5">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="vc-fig mb-2 inline-flex items-center gap-1 text-faint hover:text-live">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-[1.55rem] leading-tight tracking-[-0.02em] sm:text-[1.8rem]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-[70ch] text-[0.9rem] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  aside,
  children,
  className = "",
  flush = false,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No inner padding — for tables and lists that run edge to edge. */
  flush?: boolean;
}) {
  return (
    // min-w-0: a grid child otherwise grows to its widest content (a 640px
    // table), pushing the page sideways instead of letting the table scroll.
    <section className={`min-w-0 border border-line bg-raised ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="vc-fig text-muted">{title}</h2>
          {aside}
        </div>
      ) : null}
      <div className={flush ? "" : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon ? <div className="mb-4 grid size-12 place-items-center border border-line text-faint">{icon}</div> : null}
      <p className="font-display text-[1.15rem] tracking-[-0.015em]">{title}</p>
      {children ? <div className="mt-2 max-w-[52ch] text-[0.9rem] leading-relaxed text-muted">{children}</div> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/** A note across the top of a page: setup steps, warnings, what just happened. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: "info" | "warn" | "done";
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const bar = { info: "border-l-gold", warn: "border-l-warn", done: "border-l-earth" }[tone];
  return (
    <div
      role={tone === "warn" ? "alert" : "status"}
      className={`flex flex-wrap items-start justify-between gap-4 border border-line border-l-4 ${bar} bg-raised px-4 py-3.5`}
    >
      <div className="min-w-0 text-[0.9rem] leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-muted">{children}</div> : null}
      </div>
      {action}
    </div>
  );
}

// ------------------------------------------------------------------- badges

export type Tone = "neutral" | "live" | "earth" | "warn" | "muted" | "solid";

const toneStyles: Record<Tone, string> = {
  neutral: "border-line text-ink",
  live: "border-gold bg-gold/15 text-live",
  earth: "border-earth/50 bg-earth/10 text-earth",
  warn: "border-warn/50 bg-warn/10 text-warn",
  muted: "border-line text-faint",
  solid: "border-ink bg-ink text-ground",
};

export function Badge({ tone = "neutral", children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-[3px] text-[0.72rem] font-semibold leading-none ${toneStyles[tone]}`}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

// ------------------------------------------------------------------ buttons

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md";

const btnBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-live";
const btnVariant: Record<BtnVariant, string> = {
  primary: "bg-gold text-live-ink hover:bg-gold-hover",
  secondary: "border border-line bg-raised text-ink hover:border-ink",
  ghost: "text-muted hover:bg-sheet hover:text-ink",
  danger: "border border-warn/60 text-warn hover:bg-warn hover:text-ground",
};
const btnSize: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-[0.8rem]",
  md: "h-10 px-4 text-[0.86rem]",
};

export function btnClass(variant: BtnVariant = "secondary", size: BtnSize = "md", extra = "") {
  return `${btnBase} ${btnVariant[variant]} ${btnSize[size]} ${extra}`;
}

export function LinkButton({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: BtnVariant; size?: BtnSize }) {
  return <Link className={btnClass(variant, size, className)} {...props} />;
}

// ------------------------------------------------------------------- tables

/** Shared table classes, so every list in the admin rules and aligns the same way. */
export const table = {
  // relative: an sr-only label is absolutely positioned, and would otherwise
  // escape this scroll box and widen the whole page on a phone
  wrap: "relative overflow-x-auto",
  table: "w-full min-w-[640px] border-collapse text-left text-[0.87rem]",
  th: "vc-fig whitespace-nowrap border-b border-line px-4 py-2.5 font-normal text-faint",
  thRight: "vc-fig whitespace-nowrap border-b border-line px-4 py-2.5 text-right font-normal text-faint",
  tr: "border-b border-line-soft last:border-b-0 transition-colors hover:bg-sheet/70",
  td: "px-4 py-3 align-middle",
  tdRight: "px-4 py-3 text-right align-middle font-mono text-[0.84rem] tabular-nums",
  num: "font-mono text-[0.84rem] tabular-nums",
};

// ------------------------------------------------------------- navigation bits

/** Tabs that are links — the filter lives in the URL, so it survives a reload and can be shared. */
export function FilterTabs({
  items,
  active,
}: {
  items: { key: string; label: string; href: string; count?: number }[];
  active: string;
}) {
  return (
    <nav aria-label="Filter" className="-mb-px flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const on = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[0.86rem] font-semibold transition-colors ${
              on ? "border-gold text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {item.label}
            {item.count != null ? (
              <span className={`${table.num} text-[0.74rem] ${on ? "text-live" : "text-faint"}`}>{item.count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  hrefFor,
  noun = "results",
}: {
  page: number;
  pageCount: number;
  total: number;
  hrefFor: (page: number) => string;
  noun?: string;
}) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[0.84rem] text-muted">
      <span className={table.num}>
        {total.toLocaleString("en-NG")} {noun}
        {pageCount > 1 ? ` · page ${page} of ${pageCount}` : ""}
      </span>
      {pageCount > 1 ? (
        <div className="flex gap-2">
          {page > 1 ? (
            <LinkButton href={hrefFor(page - 1)} size="sm" aria-label="Previous page">
              ← Previous
            </LinkButton>
          ) : null}
          {page < pageCount ? (
            <LinkButton href={hrefFor(page + 1)} size="sm" aria-label="Next page">
              Next →
            </LinkButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------- forms

export const field = {
  label: "mb-1.5 block text-[0.8rem] font-semibold text-ink",
  hint: "mt-1.5 text-[0.78rem] leading-relaxed text-faint",
  error: "mt-1.5 text-[0.78rem] font-semibold text-warn",
  input:
    "h-10 w-full border border-line bg-raised px-3 text-[0.9rem] text-ink placeholder:text-faint transition-colors hover:border-muted focus:border-ink focus:outline-none aria-[invalid=true]:border-warn",
  textarea:
    "w-full border border-line bg-raised px-3 py-2.5 text-[0.9rem] leading-relaxed text-ink placeholder:text-faint transition-colors hover:border-muted focus:border-ink focus:outline-none",
  select:
    "h-10 w-full appearance-none border border-line bg-raised bg-[length:14px] bg-[right_0.7rem_center] bg-no-repeat pl-3 pr-9 text-[0.9rem] text-ink transition-colors hover:border-muted focus:border-ink focus:outline-none vc-select",
  check: "size-4 accent-[var(--vc-live)]",
};

/**
 * A stat for a card: small caps label, big figure, then an optional change
 * (signed, coloured by whether that direction is good, with ▲▼ so the colour
 * is never the only signal), a note naming what it is compared with, and a
 * sparkline of the period.
 */
export function Stat({
  label,
  value,
  delta,
  note,
  trend,
}: {
  label: string;
  value: ReactNode;
  delta?: { value: number; goodWhenUp?: boolean } | null;
  note?: ReactNode;
  trend?: number[];
}) {
  let deltaEl: ReactNode = null;
  if (delta && Number.isFinite(delta.value)) {
    const up = delta.value > 0.0005;
    const down = delta.value < -0.0005;
    const good = (delta.goodWhenUp ?? true) ? up : down;
    const bad = (delta.goodWhenUp ?? true) ? down : up;
    deltaEl = (
      <span className={`${table.num} text-[0.78rem] ${good ? "text-earth" : bad ? "text-warn" : "text-faint"}`}>
        {up ? "▲" : down ? "▼" : "·"} {Math.abs(delta.value * 100).toFixed(Math.abs(delta.value) < 0.1 ? 1 : 0)}%
      </span>
    );
  }
  return (
    <div className="min-w-0">
      <p className="vc-fig text-faint">{label}</p>
      {/* proportional figures: a big standalone number looks loose in tabular ones */}
      <p className="mt-2 font-display text-[1.7rem] leading-none tracking-[-0.025em]">{value}</p>
      {deltaEl || note ? (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[0.78rem] text-faint">
          {deltaEl}
          {note}
        </p>
      ) : null}
      {trend ? <Sparkline values={trend} className="mt-3" /> : null}
    </div>
  );
}

/** A definition list row, for detail panels. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2 text-[0.88rem] first:pt-0 last:pb-0">
      <dt className="text-faint">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
