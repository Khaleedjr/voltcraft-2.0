"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Fades and lifts its children into view as they scroll up.
 *
 * It renders visible by default — server output, no-JS, and anything already
 * on screen at load all stay fully painted. Only elements that begin below the
 * fold are hidden (via .reveal-init) and then revealed on intersection, so the
 * first frame a viewer or a thumbnail sees is never blank. `prefers-reduced-
 * motion` is honoured by the CSS, which forces the resting state visible.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    // Only hide-then-reveal things that start below the viewport; anything
    // already visible stays as it is.
    const rect = el.getBoundingClientRect();
    const below = rect.top > window.innerHeight * 0.9;
    if (!below) return;

    setArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cls = armed ? (shown ? "reveal-in" : "reveal-init") : "";
  return (
    <Tag
      ref={ref}
      className={`${cls} ${className}`.trim()}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
