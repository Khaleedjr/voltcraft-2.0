"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type MouseEvent, type ReactNode } from "react";
import { field } from "@/components/admin/ui";

/**
 * The date range for a report, and the frame it scopes.
 *
 * One row above everything it filters; every chart, stat and table below is
 * cut from the same range, so the numbers always agree. While a new range
 * loads, the report keeps its last picture, dimmed (.vc-report in
 * globals.css) — no skeleton, no jump. Without JavaScript the presets are
 * plain links and the custom range a plain GET form.
 */

const Navigate = createContext<(href: string) => void>(() => {});

export function ReportFrame({ controls, children }: { controls: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  return (
    <Navigate value={go}>
      {controls}
      <div className="vc-report grid grid-cols-1 gap-6" aria-busy={pending}>
        {children}
      </div>
    </Navigate>
  );
}

export function RangeFilter({
  path,
  presets,
  active,
  from,
  to,
  today,
}: {
  path: string;
  presets: { key: string; label: string; href: string }[];
  active: string;
  from: string;
  to: string;
  today: string;
}) {
  const go = useContext(Navigate);
  const follow = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // a new tab is the browser's business
    e.preventDefault();
    go(href);
  };
  return (
    <div className="flex min-w-0 flex-wrap items-end gap-x-4 gap-y-3">
      <nav aria-label="Date range" className="flex max-w-full overflow-x-auto border border-line bg-raised">
        {presets.map((p) => {
          const on = p.key === active;
          return (
            <Link
              key={p.key}
              href={p.href}
              scroll={false}
              onClick={follow(p.href)}
              aria-current={on ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap border-r border-line px-3.5 py-2 text-[0.84rem] font-semibold transition-colors last:border-r-0 ${
                on ? "bg-ink text-ground" : "text-muted hover:bg-sheet hover:text-ink"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </nav>
      <form
        key={`${from}:${to}`}
        method="get"
        action={path}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const sp = new URLSearchParams({ from: String(fd.get("from") ?? ""), to: String(fd.get("to") ?? "") });
          go(`${path}?${sp}`);
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="grid gap-1">
          <span className="text-[0.74rem] text-faint">From</span>
          <input type="date" name="from" required defaultValue={from} max={today} className={`${field.input} h-9 w-[9.5rem]`} />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.74rem] text-faint">To</span>
          <input type="date" name="to" required defaultValue={to} max={today} className={`${field.input} h-9 w-[9.5rem]`} />
        </label>
        <button type="submit" className={`h-9 border px-3.5 text-[0.84rem] font-semibold transition-colors ${active === "custom" ? "border-ink bg-ink text-ground" : "border-line hover:border-ink"}`}>
          {active === "custom" ? "Update" : "Custom range"}
        </button>
      </form>
    </div>
  );
}
