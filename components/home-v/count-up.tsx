"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up from zero the first time it scrolls into view.
 * Server output and reduced motion show the real number straight away.
 */
export function CountUp({ to, duration = 1100, className = "" }: { to: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const v = Math.min(1, (t - t0) / duration);
        setN(Math.round(to * (1 - Math.pow(1 - v, 3))));
        if (v < 1) raf = requestAnimationFrame(tick);
      };
      setN(0);
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {n.toLocaleString("en-NG")}
    </span>
  );
}
