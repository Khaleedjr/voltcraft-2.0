"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-context";
import { Button } from "@/components/ui";

export function ProductBuy({ slug, stock }: { slug: string; stock: number }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const max = Math.max(stock, 1);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 3000);
    return () => clearTimeout(t);
  }, [added]);

  if (stock <= 0) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="outline" disabled>
          Out of stock
        </Button>
        <p className="text-[0.85rem] text-muted">
          Tell us and we&apos;ll put it on the next order —{" "}
          <Link href="/contact" className="border-b border-ink hover:border-live hover:text-live">
            get in touch
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex items-center border border-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-11 place-items-center text-muted hover:text-ink disabled:opacity-40"
            disabled={qty <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <label htmlFor="qty" className="sr-only">
            Quantity
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={max}
            value={qty}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              setQty(Number.isNaN(n) ? 1 : Math.min(Math.max(n, 1), max));
            }}
            className="w-14 border-x border-line bg-transparent py-2.5 text-center font-mono text-[0.9rem] tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            className="grid size-11 place-items-center text-muted hover:text-ink disabled:opacity-40"
            disabled={qty >= max}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <Button
          variant="live"
          className="flex-1"
          onClick={() => {
            add(slug, qty);
            setAdded(true);
          }}
        >
          Add to cart
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-[0.85rem] text-earth">
        {added ? (
          <>
            Added.{" "}
            <Link href="/cart" className="border-b border-earth hover:text-live hover:border-live">
              Go to cart →
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
