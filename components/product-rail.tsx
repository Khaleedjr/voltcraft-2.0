"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useRef, type ReactNode } from "react";

/**
 * A row of cards that scrolls sideways and settles on each one. Touch and
 * trackpads scroll it directly; the two buttons are for a mouse, and the row
 * itself takes arrow keys once focused.
 */
export function ProductRail({ label, heading, children }: { label: string; heading: ReactNode; children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const step = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const by = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * by, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const control =
    "grid size-11 place-items-center rounded-full border border-line bg-raised text-ink transition-[border-color,transform] duration-200 hover:border-ink active:scale-95";

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-6">
        {heading}
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => step(-1)} className={control} aria-label="Scroll back">
            <ArrowLeft size={18} weight="bold" aria-hidden />
          </button>
          <button type="button" onClick={() => step(1)} className={control} aria-label="Scroll forward">
            <ArrowRight size={18} weight="bold" aria-hidden />
          </button>
        </div>
      </div>
      <div
        ref={rail}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="vc-rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        {children}
      </div>
    </div>
  );
}
