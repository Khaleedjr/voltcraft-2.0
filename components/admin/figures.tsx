import type { ReactNode } from "react";
import { formatCount, formatPercent } from "@/lib/admin/format";
import { formatNaira } from "@/lib/format";

/**
 * The quiet figures: sparklines for stat tiles, ranked bars, the order
 * pipeline and a meter. They carry every number as text beside the mark, so
 * they need no hover layer and ship no JavaScript. Same rules and tokens as
 * charts.tsx.
 */

/**
 * A stat tile's trend: the period in the context grey, its latest point in
 * the accent. The line stretches to the tile; the dot is HTML so it stays round.
 */
export function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const h = 28;
  const pad = 4; // room for the dot at the top and bottom
  const yOf = (v: number) => pad + (1 - (v - min) / span) * (h - pad * 2);
  const points = values.map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(2)},${yOf(v).toFixed(2)}`).join(" ");
  const last = values[values.length - 1];
  return (
    <div className={`relative h-7 ${className}`} aria-hidden>
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <polyline points={points} fill="none" stroke="var(--vc-chart-context)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--vc-chart-1)] ring-2 ring-raised"
        style={{ left: "100%", top: `${(yOf(last) / h) * 100}%` }}
      />
    </div>
  );
}

export type BarLine = { key: string; name: ReactNode; value: number; count?: string; share?: number; context?: boolean };

/**
 * Ranked horizontal bars, one hue: the length is the value, scaled to the
 * longest line; the value and its share sit in text above each bar. A folded
 * "Other" line takes the context grey, since it is not one thing.
 */
export function BarList({ lines, unit = "naira", empty = "Nothing yet." }: { lines: BarLine[]; unit?: "naira" | "count"; empty?: string }) {
  const max = Math.max(0, ...lines.map((l) => l.value));
  if (!lines.length || max === 0) return <p className="py-6 text-center text-[0.86rem] text-faint">{empty}</p>;
  return (
    <ol className="grid grid-cols-1 gap-3.5">
      {lines.map((l) => (
        <li key={l.key} className="grid min-w-0 gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-[0.86rem]">
            <span className="min-w-0 truncate">
              {l.name}
              {l.count ? <span className="ml-2 text-[0.76rem] text-faint">{l.count}</span> : null}
            </span>
            <span className="shrink-0 font-mono text-[0.82rem] tabular-nums">
              {unit === "naira" ? formatNaira(l.value) : formatCount(l.value)}
              {l.share != null ? <span className="ml-2 inline-block w-9 text-right text-faint">{formatPercent(l.share)}</span> : null}
            </span>
          </div>
          <div className="h-2">
            <div
              className="h-2 rounded-r-[4px]"
              style={{ width: `${Math.max(0.8, (l.value / max) * 100)}%`, background: l.context ? "var(--vc-chart-context)" : "var(--vc-chart-1)" }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Orders through the pipeline — placed, paid, shipped, delivered — as bars
 * from one baseline. The stages are an order, so the colour steps along one
 * hue rather than changing hue; the numbers and shares are text beside them.
 */
export function Pipeline({ stages, notes }: { stages: { name: string; value: number; hint?: string }[]; notes?: ReactNode }) {
  const base = stages[0]?.value ?? 0;
  return (
    <div>
      <ol className="grid gap-3">
        {stages.map((s, i) => (
          <li key={s.name} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 text-[0.86rem]">
            <span className="text-muted" title={s.hint}>
              {s.name}
            </span>
            <span className="block h-3.5">
              {s.value > 0 ? (
                <span
                  className="block h-3.5 rounded-r-[4px]"
                  style={{ width: `${Math.max(1.5, base ? (s.value / base) * 100 : 0)}%`, background: `var(--vc-ord-${i + 1})` }}
                />
              ) : null}
            </span>
            <span className="w-[5.5rem] text-right font-mono text-[0.82rem] tabular-nums">
              {formatCount(s.value)}
              {i > 0 && base ? <span className="ml-2 inline-block w-9 text-faint">{formatPercent(s.value / base)}</span> : <span className="ml-2 inline-block w-9" />}
            </span>
          </li>
        ))}
      </ol>
      {notes ? <div className="mt-4 border-t border-line-soft pt-3 text-[0.8rem] leading-relaxed text-muted">{notes}</div> : null}
    </div>
  );
}

/** A share of a whole, as a filled track: the track is a paler step of the fill's own hue. */
export function Meter({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label={label} className="h-2.5 w-full rounded-[4px] bg-[var(--vc-seq-1)]">
      <div className="h-2.5 rounded-[4px] bg-[var(--vc-chart-1)]" style={{ width: `${pct * 100}%` }} />
    </div>
  );
}
