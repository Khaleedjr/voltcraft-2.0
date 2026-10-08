"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddToCart } from "@/components/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { maxOrderable, type Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

/**
 * The sale as a spotlight: one deal large, the others as numbered tabs under
 * it. It moves on by itself every few seconds, with a bar filling under the
 * current tab to say so; it holds still while the pointer is over it, after
 * any click, and under reduced motion.
 */
export function Spotlight({ products }: { products: Product[] }) {
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || held || products.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setAt((i) => (i + 1) % products.length), 5000);
    return () => clearTimeout(t);
  }, [at, auto, held, products.length]);

  const p = products[at];
  if (!p) return null;
  const save = p.compareAt && p.compareAt > p.price ? p.compareAt - p.price : 0;

  return (
    <div onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)}>
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <Link key={p.slug} href={`/product/${p.slug}`} className="hv2-spot-photo group relative block">
          <ProductImage product={p} ratio="aspect-[4/3]" sizes="(max-width: 1024px) 100vw, 560px" pad="p-10" />
          {save ? (
            <span className="vc-fig absolute left-0 top-0 z-10 bg-gold px-3 py-2 text-live-ink">Save {formatNaira(save)}</span>
          ) : null}
        </Link>
        <div key={`${p.slug}-text`} className="hv2-spot-text">
          <p className="vc-fig text-live">
            Deal {at + 1} of {products.length}
          </p>
          <h3 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.5rem)] leading-[1.08] tracking-[-0.025em]">
            <Link href={`/product/${p.slug}`} className="hover:text-live">
              {p.name}
            </Link>
          </h3>
          <p className="mt-3 max-w-[48ch] text-[0.95rem] leading-relaxed text-muted">{p.summary}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-[2.4rem] leading-none tabular-nums">{formatNaira(p.price)}</span>
            {p.compareAt ? <span className="text-[1.05rem] text-faint line-through tabular-nums">{formatNaira(p.compareAt)}</span> : null}
          </div>
          <div className="mt-6">
            <AddToCart slug={p.slug} stock={maxOrderable(p)} hasOptions={Boolean(p.variants?.length)} />
          </div>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-5 gap-2 sm:gap-3" role="tablist" aria-label="Deals">
        {products.map((q, i) => (
          <button
            key={q.slug}
            type="button"
            role="tab"
            aria-selected={i === at}
            aria-label={q.name}
            onClick={() => {
              setAt(i);
              setAuto(false);
            }}
            className={`hv2-tab group relative text-left ${i === at ? "is-on" : ""}`}
          >
            <ProductImage product={q} ratio="aspect-square" sizes="120px" pad="p-2" />
            <span className="vc-fig mt-2 block text-faint">{String(i + 1).padStart(2, "0")}</span>
            <span className="hv2-tab-bar" style={{ animationPlayState: auto && !held && i === at ? "running" : "paused" }} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
