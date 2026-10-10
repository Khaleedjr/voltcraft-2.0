"use client";

import { useRef, type ReactNode } from "react";

/**
 * A lamp that follows the pointer across the night-shift hero: it only sets
 * two custom properties, and the CSS draws the light (.hv4-lamp).
 */
export function Lamp({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`hv4-lamp ${className}`}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
