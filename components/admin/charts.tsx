"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { formatCount, formatNairaCompact } from "@/lib/admin/format";
import { formatNaira } from "@/lib/format";

/**
 * The admin's charts, drawn from scratch in SVG.
 *
 * They follow one set of rules: thin marks (2px lines, bars no thicker than
 * 24px with a 4px rounded end, square at the baseline), hairline grids, a
 * 2px gap of card colour between touching marks and around dots, and text in
 * ink colours — never in the series colour. Every chart answers the pointer
 * (a crosshair on lines, the bar itself on columns) and the keyboard (focus
 * it, then the arrow keys), and every chart has its numbers as a table
 * underneath, so nothing is only readable by hovering.
 *
 * Colours are the --vc-chart-* tokens in globals.css.
 */

export type Unit = "naira" | "count";

const exact = (unit: Unit, v: number) => (unit === "naira" ? formatNaira(v) : formatCount(v));
const brief = (unit: Unit, v: number) => (unit === "naira" ? formatNairaCompact(v) : formatCount(v));

/** Round axis ticks — 0, 50K, 100K — with a step of 1, 2, 2.5 or 5 times a power of ten. */
export function niceScale(max: number, count = 4, integer = false): { top: number; ticks: number[] } {
  if (!(max > 0)) return { top: 1, ticks: [0] };
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const steps = (integer && pow < 10 ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]).map((m) => m * pow);
  const step = Math.max(integer ? 1 : 0, steps.find((s) => s >= raw) ?? steps[steps.length - 1]);
  const top = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(Math.round(t * 1000) / 1000);
  return { top, ticks };
}

/** The container's width in pixels, so text is drawn at its real size rather than scaled. */
function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry?.contentRect.width ?? 0);
      if (w > 0) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Arrow keys walk the points; the pointer picks the nearest. Shared by every chart with an x axis. */
function useActiveIndex(n: number) {
  const [active, setActive] = useState<number | null>(null);
  const [byKeyboard, setByKeyboard] = useState(false);
  const onKeyDown = (e: KeyboardEvent) => {
    const moves: Record<string, (i: number | null) => number | null> = {
      ArrowRight: (i) => Math.min(n - 1, (i ?? -1) + 1),
      ArrowLeft: (i) => Math.max(0, (i ?? n) - 1),
      Home: () => 0,
      End: () => n - 1,
      Escape: () => null,
    };
    const move = moves[e.key];
    if (!move || n === 0) return;
    e.preventDefault();
    setByKeyboard(true);
    setActive(move);
  };
  return {
    active,
    byKeyboard,
    point: (i: number | null) => {
      setByKeyboard(false);
      setActive(i);
    },
    focusProps: {
      tabIndex: 0,
      onKeyDown,
      onFocus: () => {
        setByKeyboard(true);
        setActive((i) => i ?? (n ? n - 1 : null));
      },
      onBlur: () => setActive(null),
    },
  };
}

/** Which x labels to print so they never collide: the latest always, then every k-th back from it. */
function labelEvery(n: number, room: number, each = 70): (i: number) => boolean {
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(room / each))));
  return (i) => (n - 1 - i) % step === 0;
}

// ------------------------------------------------------------------ pieces

function LineKey({ color }: { color: string }) {
  return <span className="inline-block h-[2px] w-3.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />;
}

function BoxKey({ color }: { color: string }) {
  return <span className="inline-block size-2.5 shrink-0 rounded-[2px]" style={{ background: color }} aria-hidden />;
}

/** Legend above a chart with two or more series: a line key for lines, a box for bars. */
function Legend({ items, kind }: { items: { name: string; color: string }[]; kind: "line" | "box" }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.78rem] text-muted">
      {items.map((s) => (
        <li key={s.name} className="flex items-center gap-2">
          {kind === "line" ? <LineKey color={s.color} /> : <BoxKey color={s.color} />}
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function Tooltip({ x, width, top = 8, title, rows }: { x: number; width: number; top?: number; title: string; rows: { key: ReactNode; value: string; name: string }[] }) {
  const flip = x > width * 0.62;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 min-w-[9.5rem] border border-line bg-raised px-3 py-2 text-[0.8rem] shadow-[0_10px_30px_rgba(var(--vc-shadow),0.16)]"
      style={{ left: x, top, transform: flip ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
    >
      <p className="mb-1 text-[0.74rem] text-faint">{title}</p>
      {rows.map((r) => (
        <p key={r.name} className="flex items-center gap-2 whitespace-nowrap leading-relaxed">
          {r.key}
          <strong className="font-semibold tabular-nums">{r.value}</strong>
          <span className="text-muted">{r.name}</span>
        </p>
      ))}
    </div>
  );
}

/** The chart's twin: the same numbers as a table, one click away. */
export function ChartTable({ head, rows, summary = "Show the numbers" }: { head: string[]; rows: (string | number)[][]; summary?: string }) {
  return (
    <details className="group mt-3 text-[0.82rem]">
      <summary className="inline-flex cursor-pointer select-none items-center gap-1.5 text-muted hover:text-live">
        <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
          ›
        </span>
        {summary}
      </summary>
      <div className="relative mt-2 max-h-80 overflow-auto border border-line-soft">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-sheet">
            <tr>
              {head.map((h, i) => (
                <th key={h} scope="col" className={`whitespace-nowrap border-b border-line px-3 py-2 font-semibold ${i ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-b border-line-soft last:border-b-0">
                {r.map((c, ci) =>
                  ci === 0 ? (
                    <th key={ci} scope="row" className="whitespace-nowrap px-3 py-1.5 font-normal">
                      {c}
                    </th>
                  ) : (
                    <td key={ci} className="whitespace-nowrap px-3 py-1.5 text-right font-mono tabular-nums">
                      {c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** A path for a bar with its data end rounded and its baseline end square. */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

function YAxis({ ticks, labels, y, left, right }: { ticks: number[]; labels: string[]; y: (v: number) => number; left: number; right: number }) {
  return (
    <g>
      {ticks.map((t, i) => (
        <g key={t}>
          <line x1={left} x2={right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--vc-chart-axis)" : "var(--vc-chart-grid)"} strokeWidth={1} shapeRendering="crispEdges" />
          <text x={left - 8} y={y(t) + 4} textAnchor="end" className="fill-faint font-mono text-[11px] tabular-nums">
            {labels[i]}
          </text>
        </g>
      ))}
    </g>
  );
}

function XLabels({ labels, x, y, show, left, right }: { labels: string[]; x: (i: number) => number; y: number; show: (i: number) => boolean; left: number; right: number }) {
  return (
    <g>
      {labels.map((l, i) => {
        if (!show(i)) return null;
        const cx = x(i);
        const anchor = cx - left < 26 ? "start" : right - cx < 26 ? "end" : "middle";
        return (
          <text key={i} x={anchor === "start" ? Math.max(cx - 6, left - 4) : anchor === "end" ? Math.min(cx + 6, right + 4) : cx} y={y} textAnchor={anchor} className="fill-faint text-[11px]">
            {l}
          </text>
        );
      })}
    </g>
  );
}

// -------------------------------------------------------------------- lines

export type TrendPoint = { label: string; tip: string; value: number; previous?: number };

/**
 * One series over time, as a 2px line over a faint wash, with an optional
 * comparison in the context grey. The crosshair snaps to the nearest point
 * and the readout lists both series, so the pointer never has to find a line.
 */
export function TrendChart({
  points,
  unit,
  name,
  previousName,
  height = 260,
  empty = "Nothing in this period yet.",
  label,
}: {
  points: TrendPoint[];
  unit: Unit;
  name: string;
  /** Show the comparison series under this name. */
  previousName?: string;
  height?: number;
  empty?: string;
  /** What the chart shows, for screen readers. */
  label: string;
}) {
  const [box, width] = useWidth(720);
  const n = points.length;
  const { active, byKeyboard, point, focusProps } = useActiveIndex(n);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId();

  const withPrevious = previousName != null && points.some((p) => (p.previous ?? 0) > 0);
  const max = Math.max(0, ...points.map((p) => Math.max(p.value, withPrevious ? (p.previous ?? 0) : 0)));
  const { top, ticks } = niceScale(max, 4, unit === "count");
  const tickLabels = ticks.map((t) => brief(unit, t));
  const left = Math.max(28, Math.max(...tickLabels.map((l) => l.length)) * 7 + 14);
  const right = width - 14;
  const topPad = 24;
  const bottom = height - 30;
  const plotW = Math.max(40, right - left);
  const x = (i: number) => left + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const y = (v: number) => bottom - (v / top) * (bottom - topPad);

  const path = (get: (p: TrendPoint) => number) => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(get(p)).toFixed(1)}`).join("");
  const line = path((p) => p.value);
  const area = n ? `${line}L${x(n - 1).toFixed(1)},${bottom}L${x(0).toFixed(1)},${bottom}Z` : "";
  const peak = max > 0 ? points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0) : -1;
  const show = labelEvery(n, plotW);

  const onPointer = (e: ReactPointerEvent) => {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const i = n <= 1 ? 0 : Math.round(((px - left) / plotW) * (n - 1));
    point(Math.max(0, Math.min(n - 1, i)));
  };

  const a = active != null ? points[active] : null;
  const rows = a
    ? [
        { key: <LineKey color="var(--vc-chart-1)" />, value: exact(unit, a.value), name },
        ...(withPrevious ? [{ key: <LineKey color="var(--vc-chart-context)" />, value: exact(unit, a.previous ?? 0), name: previousName! }] : []),
      ]
    : [];

  return (
    <figure className="m-0">
      {withPrevious ? (
        <Legend
          kind="line"
          items={[
            { name, color: "var(--vc-chart-1)" },
            { name: previousName!, color: "var(--vc-chart-context)" },
          ]}
        />
      ) : null}
      <div
        ref={box}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each point.`}
        className="relative outline-offset-4 focus-visible:outline-2 focus-visible:outline-live"
        onPointerLeave={() => point(null)}
        {...focusProps}
      >
        <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMin meet" className="block w-full touch-pan-y select-none" aria-hidden>
          <defs>
            <clipPath id={clipId}>
              <rect x={left} y={0} width={plotW} height={bottom + 1} />
            </clipPath>
          </defs>
          <YAxis ticks={ticks} labels={tickLabels} y={y} left={left} right={right} />
          <XLabels labels={points.map((p) => p.label)} x={x} y={height - 8} show={show} left={left} right={right} />
          {max > 0 ? (
            <g clipPath={`url(#${clipId})`}>
              {withPrevious ? (
                <path d={path((p) => p.previous ?? 0)} fill="none" stroke="var(--vc-chart-context)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              ) : null}
              <path d={area} fill="var(--vc-chart-1)" fillOpacity={0.1} />
              <path d={line} fill="none" stroke="var(--vc-chart-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ) : (
            <text x={left + plotW / 2} y={(topPad + bottom) / 2} textAnchor="middle" className="fill-faint text-[13px]">
              {empty}
            </text>
          )}
          {peak >= 0 && active == null ? (
            <g>
              <circle cx={x(peak)} cy={y(points[peak].value)} r={4} fill="var(--vc-chart-1)" stroke="var(--vc-raised)" strokeWidth={2} />
              <text
                x={x(peak)}
                y={y(points[peak].value) - 10}
                textAnchor={x(peak) - left < 30 ? "start" : right - x(peak) < 30 ? "end" : "middle"}
                className="fill-ink font-mono text-[11px] font-semibold tabular-nums"
                stroke="var(--vc-raised)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {brief(unit, points[peak].value)}
              </text>
            </g>
          ) : null}
          {a && active != null ? (
            <g>
              <line x1={x(active)} x2={x(active)} y1={topPad - 6} y2={bottom} stroke="var(--vc-faint)" strokeWidth={1} shapeRendering="crispEdges" />
              {withPrevious ? <circle cx={x(active)} cy={y(a.previous ?? 0)} r={4} fill="var(--vc-chart-context)" stroke="var(--vc-raised)" strokeWidth={2} /> : null}
              <circle cx={x(active)} cy={y(a.value)} r={4} fill="var(--vc-chart-1)" stroke="var(--vc-raised)" strokeWidth={2} />
            </g>
          ) : null}
          {/* the hit area: the whole plot, so the pointer only has to be near a date */}
          <rect x={left - 8} y={0} width={plotW + 16} height={bottom + 8} fill="transparent" onPointerMove={onPointer} onPointerDown={onPointer} />
        </svg>
        {a && active != null ? <Tooltip x={x(active)} width={width} top={topPad} title={a.tip} rows={rows} /> : null}
        <p className="sr-only" aria-live="polite">
          {byKeyboard && a ? `${a.tip}: ${rows.map((r) => `${r.name} ${r.value}`).join(", ")}` : ""}
        </p>
      </div>
      <ChartTable
        head={["Period", name, ...(withPrevious ? [previousName!] : [])]}
        rows={points.map((p) => [p.tip, exact(unit, p.value), ...(withPrevious ? [exact(unit, p.previous ?? 0)] : [])])}
      />
    </figure>
  );
}

// ------------------------------------------------------------------ columns

export type ColumnPoint = { label: string; tip: string; values: number[] };

/**
 * Columns, stacked bottom to top in the order of `series`. The first series
 * is the point (amber); the rest are context (grey). Each column is its own
 * hit target, and the hovered one stays full strength while the rest recede.
 */
export function ColumnChart({
  points,
  series,
  unit = "count",
  height = 230,
  totalName,
  label,
  empty = "Nothing in this period yet.",
}: {
  points: ColumnPoint[];
  series: { name: string; color: string }[];
  unit?: Unit;
  height?: number;
  /** Name for the stack's total in the readout and table, e.g. "placed". */
  totalName?: string;
  label: string;
  empty?: string;
}) {
  const [box, width] = useWidth(720);
  const n = points.length;
  const { active, byKeyboard, point, focusProps } = useActiveIndex(n);

  const sums = points.map((p) => p.values.reduce((s, v) => s + v, 0));
  const max = Math.max(0, ...sums);
  const { top, ticks } = niceScale(max, 4, unit === "count");
  const tickLabels = ticks.map((t) => brief(unit, t));
  const left = Math.max(28, Math.max(...tickLabels.map((l) => l.length)) * 7 + 14);
  const right = width - 8;
  const topPad = 14;
  const bottom = height - 30;
  const plotW = Math.max(40, right - left);
  const band = n ? plotW / n : plotW;
  const barW = Math.max(2, Math.min(24, band * 0.62));
  const cx = (i: number) => left + band * (i + 0.5);
  const y = (v: number) => bottom - (v / top) * (bottom - topPad);
  const show = labelEvery(n, plotW);

  const a = active != null ? points[active] : null;
  const rows = a
    ? [
        ...series.map((s, si) => ({ key: <BoxKey color={s.color} />, value: exact(unit, a.values[si] ?? 0), name: s.name })),
        ...(totalName && series.length > 1 ? [{ key: <span className="w-2.5" />, value: exact(unit, sums[active!]), name: totalName }] : []),
      ]
    : [];

  return (
    <figure className="m-0">
      {series.length > 1 ? <Legend kind="box" items={series} /> : null}
      <div
        ref={box}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each column.`}
        className="relative outline-offset-4 focus-visible:outline-2 focus-visible:outline-live"
        onPointerLeave={() => point(null)}
        {...focusProps}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMin meet" className="block w-full touch-pan-y select-none" aria-hidden>
          <YAxis ticks={ticks} labels={tickLabels} y={y} left={left} right={right} />
          <XLabels labels={points.map((p) => p.label)} x={cx} y={height - 8} show={show} left={left} right={right} />
          {max > 0 ? (
            points.map((p, i) => {
              // stack from the baseline; each segment after the first leaves a
              // 2px gap of card colour under it, and only the top one is rounded
              const drawn: { y: number; h: number; color: string }[] = [];
              let base = bottom;
              p.values.forEach((v, si) => {
                if (v <= 0) return;
                const gap = drawn.length ? 2 : 0;
                const h = Math.max(1, (v / top) * (bottom - topPad) - gap);
                drawn.push({ y: base - gap - h, h, color: series[si]?.color ?? "var(--vc-chart-context)" });
                base = base - gap - h;
              });
              return (
                <g key={i} opacity={active != null && active !== i ? 0.45 : 1} className="transition-opacity duration-150">
                  {drawn.map((d, di) =>
                    di === drawn.length - 1 ? (
                      <path key={di} d={barPath(cx(i) - barW / 2, d.y, barW, d.h, 4)} fill={d.color} />
                    ) : (
                      <rect key={di} x={cx(i) - barW / 2} y={d.y} width={barW} height={d.h} fill={d.color} />
                    ),
                  )}
                </g>
              );
            })
          ) : (
            <text x={left + plotW / 2} y={(topPad + bottom) / 2} textAnchor="middle" className="fill-faint text-[13px]">
              {empty}
            </text>
          )}
          {/* hit targets: each column's whole band, wider than the bar itself */}
          {points.map((_, i) => (
            <rect key={i} x={left + band * i} y={0} width={band} height={bottom + 8} fill="transparent" onPointerEnter={() => point(i)} onPointerDown={() => point(i)} />
          ))}
        </svg>
        {a && active != null ? <Tooltip x={cx(active)} width={width} top={topPad} title={a.tip} rows={rows} /> : null}
        <p className="sr-only" aria-live="polite">
          {byKeyboard && a ? `${a.tip}: ${rows.map((r) => `${r.name} ${r.value}`).join(", ")}` : ""}
        </p>
      </div>
      <ChartTable
        head={["Period", ...series.map((s) => s.name), ...(totalName && series.length > 1 ? [totalName[0].toUpperCase() + totalName.slice(1)] : [])]}
        rows={points.map((p, i) => [p.tip, ...series.map((_, si) => exact(unit, p.values[si] ?? 0)), ...(totalName && series.length > 1 ? [exact(unit, sums[i])] : [])])}
      />
    </figure>
  );
}

// ------------------------------------------------------------------ heatmap

const HEAT = ["var(--vc-chart-empty)", "var(--vc-seq-1)", "var(--vc-seq-2)", "var(--vc-seq-3)", "var(--vc-seq-4)", "var(--vc-seq-5)"];
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

/**
 * Counts on a weekday × hour grid, in one hue from pale (a few) to deep (the
 * most). Five steps, so neighbouring shades stay tellable apart; the legend
 * says which counts each step holds.
 */
export function HeatGrid({ cells, rows, noun = ["order", "orders"], label }: { cells: number[][]; rows: readonly string[]; noun?: [string, string]; label: string }) {
  const max = Math.max(0, ...cells.flat());
  const step = (v: number) => (v <= 0 || max === 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5)));
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [byKeyboard, setByKeyboard] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; width: number } | null>(null);
  const words = (v: number) => `${formatCount(v)} ${v === 1 ? noun[0] : noun[1]}`;

  // the counts each shade stands for, e.g. "3–4"
  const bins = [1, 2, 3, 4, 5]
    .map((k) => {
      const lo = Math.floor((max * (k - 1)) / 5) + 1;
      const hi = Math.floor((max * k) / 5);
      return { k, text: lo > hi ? null : lo === hi ? String(lo) : `${lo}–${hi}` };
    })
    .filter((b) => b.text);

  const place = (r: number, c: number) => {
    const grid = gridRef.current;
    const cell = grid?.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`);
    if (!grid || !cell) return;
    const g = grid.getBoundingClientRect();
    const b = cell.getBoundingClientRect();
    setTip({ x: b.left - g.left + b.width / 2, y: b.top - g.top + b.height, width: g.width });
  };
  const select = (r: number, c: number, keyboard: boolean) => {
    setByKeyboard(keyboard);
    setActive({ r, c });
    place(r, c);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const cur = active ?? { r: 0, c: 0 };
    const next: Record<string, { r: number; c: number }> = {
      ArrowRight: { r: cur.r, c: Math.min(23, cur.c + 1) },
      ArrowLeft: { r: cur.r, c: Math.max(0, cur.c - 1) },
      ArrowDown: { r: Math.min(rows.length - 1, cur.r + 1), c: cur.c },
      ArrowUp: { r: Math.max(0, cur.r - 1), c: cur.c },
    };
    if (e.key === "Escape") return setActive(null);
    const to = next[e.key];
    if (!to) return;
    e.preventDefault();
    select(to.r, to.c, true);
  };
  const v = active ? (cells[active.r]?.[active.c] ?? 0) : 0;

  return (
    <figure className="m-0">
      <div
        ref={gridRef}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each hour.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (!active) select(0, 0, true);
        }}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="relative overflow-x-auto outline-offset-4 focus-visible:outline-2 focus-visible:outline-live"
      >
        <div className="grid min-w-[560px] grid-cols-[2.6rem_repeat(24,minmax(0,1fr))] gap-[2px]" aria-hidden>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="pb-1 text-[10.5px] text-faint tabular-nums">
              {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
            </span>
          ))}
          {rows.map((day, r) => (
            <div key={day} className="contents">
              <span className="self-center pr-2 text-[11px] text-faint">{day}</span>
              {Array.from({ length: 24 }, (_, c) => {
                const value = cells[r]?.[c] ?? 0;
                const on = active?.r === r && active.c === c;
                return (
                  <span
                    key={c}
                    data-cell={`${r}-${c}`}
                    onPointerEnter={() => select(r, c, false)}
                    onPointerDown={() => select(r, c, false)}
                    className={`h-6 rounded-[2px] sm:h-7 ${on ? "outline-2 outline-offset-1 outline-ink" : ""}`}
                    style={{ background: HEAT[step(value)] }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {active && tip ? (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 whitespace-nowrap border border-line bg-raised px-3 py-2 text-[0.8rem] shadow-[0_10px_30px_rgba(var(--vc-shadow),0.16)]"
            style={{ left: tip.x, top: tip.y + 6, transform: tip.x > tip.width * 0.62 ? "translateX(-100%)" : tip.x < tip.width * 0.2 ? "none" : "translateX(-50%)" }}
          >
            <p className="text-[0.74rem] text-faint">
              {rows[active.r]} · {hourLabel(active.c)}–{hourLabel((active.c + 1) % 24)}
            </p>
            <p className="font-semibold tabular-nums">{words(v)}</p>
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {byKeyboard && active ? `${rows[active.r]} ${hourLabel(active.c)}: ${words(v)}` : ""}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.76rem] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-[2px]" style={{ background: HEAT[0] }} aria-hidden /> None
        </span>
        {bins.map((b) => (
          <span key={b.k} className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-[2px]" style={{ background: HEAT[b.k] }} aria-hidden />
            <span className="tabular-nums">{b.text}</span>
          </span>
        ))}
        <span className="text-faint">{noun[1]} an hour, Lagos time</span>
      </div>
      <ChartTable
        head={["Day", ...Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"))]}
        rows={rows.map((day, r) => [day, ...Array.from({ length: 24 }, (_, c) => cells[r]?.[c] ?? 0)])}
      />
    </figure>
  );
}
