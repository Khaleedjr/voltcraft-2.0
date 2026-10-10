"use client";

import { useEffect, useState } from "react";

/**
 * The split-screen page's contents list: it marks the section in view as the
 * right-hand column scrolls past, and jumps to one when clicked.
 */
export function ScrollSpy({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  return (
    <ol className="border-t border-line">
      {items.map((it, i) => (
        <li key={it.id} className="border-b border-line">
          <a
            href={`#${it.id}`}
            aria-current={active === it.id ? "true" : undefined}
            className="hv3-spy group flex items-center gap-4 py-2.5 text-[0.95rem] font-medium text-muted"
          >
            <span className="vc-fig w-6">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1">{it.label}</span>
            <span className="hv3-spy-bar" aria-hidden />
          </a>
        </li>
      ))}
    </ol>
  );
}
