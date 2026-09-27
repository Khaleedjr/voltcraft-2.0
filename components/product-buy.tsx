"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-context";
import { Button } from "@/components/ui";
import type { Variant } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

/**
 * Quantity and add to cart, plus the option picker for a product sold in
 * options. Nothing is chosen for the customer: a resistor bought in the wrong
 * value is worse than a tap asking which one.
 */
export function ProductBuy({ slug, stock, variants }: { slug: string; stock: number; variants?: Variant[] }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(variants?.length === 1 ? variants[0].label : null);
  const [asking, setAsking] = useState(false);
  const pickerRef = useRef<HTMLFieldSetElement>(null);
  const max = Math.max(stock, 1);
  const options = variants?.length ? variants : null;
  const priced = options ? options.some((v) => v.price !== options[0].price) : false;

  useEffect(() => {
    if (added === null) return;
    const t = setTimeout(() => setAdded(null), 3000);
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

  function addToCart() {
    if (options && !choice) {
      setAsking(true);
      pickerRef.current?.querySelector("input")?.focus();
      return;
    }
    add({ slug, ...(choice ? { variant: choice } : {}) }, qty);
    setAdded(choice ? `${qty} × ${choice}` : "");
  }

  return (
    <div className="flex flex-col gap-3">
      {options ? (
        <fieldset ref={pickerRef} className="mb-2" aria-describedby={asking ? "option-ask" : undefined}>
          <legend className="vc-fig text-muted">
            Choose an option <span className="text-faint">· {options.length}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((v) => (
              <label key={v.label} className="cursor-pointer">
                <input
                  type="radio"
                  name={`option-${slug}`}
                  value={v.label}
                  checked={choice === v.label}
                  onChange={() => {
                    setChoice(v.label);
                    setAsking(false);
                  }}
                  className="peer sr-only"
                />
                <span className="flex items-baseline gap-2 border border-line bg-raised px-3 py-2 text-[0.88rem] tabular-nums transition-colors hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-live">
                  {v.label}
                  {priced ? <span className="text-[0.8rem] opacity-70">{formatNaira(v.price)}</span> : null}
                </span>
              </label>
            ))}
          </div>
          {asking ? (
            <p id="option-ask" role="alert" className="mt-3 text-[0.85rem] text-warn">
              Pick an option first, then add it to the cart.
            </p>
          ) : null}
        </fieldset>
      ) : null}

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
        <Button variant="live" className="flex-1" onClick={addToCart}>
          Add to cart
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-[0.85rem] text-earth">
        {added !== null ? (
          <>
            Added{added ? ` ${added}` : ""}.{" "}
            <Link href="/cart" className="border-b border-earth hover:text-live hover:border-live">
              Go to cart →
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
