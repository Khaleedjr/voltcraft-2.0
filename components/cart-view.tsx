"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { maxOrderable } from "@/lib/catalogue";
import { ProductImage } from "@/components/product-image";
import { ButtonLink, Fig } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import { DELIVERY_FEE, priceOrder } from "@/lib/orders";
import { SITE } from "@/lib/site";

export function CartView() {
  const { lines, setQty, remove, ready } = useCart();
  const order = priceOrder(lines);

  if (!ready) {
    return <p className="py-10 text-[0.92rem] text-muted">Loading your cart…</p>;
  }

  if (order.items.length === 0) {
    return (
      <div className="border border-line bg-sheet p-10 text-center">
        <p className="font-display text-[1.6rem] tracking-[-0.022em]">Nothing in the cart yet.</p>
        <p className="mx-auto mt-3 max-w-[44ch] text-[0.93rem] leading-relaxed text-muted">
          Pick up a board, a sensor and the jumper wires you keep losing.
        </p>
        <div className="mt-7 flex justify-center">
          <ButtonLink href="/shop">Browse the catalogue</ButtonLink>
        </div>
      </div>
    );
  }

  const shortfall = SITE.freeDeliveryThreshold - order.subtotal;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-14">
      <ul className="border-t border-line">
        {order.items.map(({ product, qty, lineTotal }) => (
          <li key={product.slug} className="grid grid-cols-[84px_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[110px_1fr]">
            <Link href={`/product/${product.slug}`} aria-label={product.name}>
              <ProductImage product={product} ratio="aspect-square" sizes="110px" />
            </Link>
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <Link href={`/product/${product.slug}`} className="text-[0.95rem] font-semibold leading-snug hover:text-live">
                  {product.name}
                </Link>
                <span className="font-display text-[1.15rem] tabular-nums">{formatNaira(lineTotal)}</span>
              </div>
              <p className="vc-fig text-faint">
                {product.sku} · {formatNaira(product.price)} each
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center border border-line">
                  <button
                    type="button"
                    onClick={() => setQty(product.slug, qty - 1)}
                    className="grid size-9 place-items-center text-muted hover:text-ink"
                    aria-label={`Decrease quantity of ${product.name}`}
                  >
                    −
                  </button>
                  <span className="w-10 border-x border-line py-1.5 text-center font-mono text-[0.85rem] tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(product.slug, qty + 1)}
                    disabled={qty >= maxOrderable(product)}
                    className="grid size-9 place-items-center text-muted hover:text-ink disabled:opacity-40"
                    aria-label={`Increase quantity of ${product.name}`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(product.slug)}
                  className="text-[0.83rem] text-muted underline-offset-4 hover:text-live hover:underline"
                >
                  Remove
                </button>
                {product.stock != null && qty >= product.stock ? (
                  <span className="vc-fig text-warn">All {product.stock} in stock</span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-max border border-line bg-sheet p-6 lg:sticky lg:top-40">
        <Fig>Summary</Fig>
        <dl className="mt-4 grid gap-3 text-[0.92rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatNaira(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Delivery</dt>
            <dd className="tabular-nums">
              {order.freeDelivery ? <span className="text-earth">Free</span> : formatNaira(order.delivery)}
            </dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-4">
            <dt className="font-semibold">Total</dt>
            <dd className="font-display text-[1.6rem] tabular-nums">{formatNaira(order.total)}</dd>
          </div>
        </dl>

        {!order.freeDelivery && shortfall > 0 ? (
          <p className="mt-4 border-l-2 border-live pl-3 text-[0.85rem] leading-relaxed text-muted">
            Add {formatNaira(shortfall)} more and delivery drops from {formatNaira(DELIVERY_FEE)} to
            free.
          </p>
        ) : null}

        <div className="mt-6 grid gap-3">
          <ButtonLink href="/checkout">Checkout</ButtonLink>
          <ButtonLink href="/shop" variant="outline">
            Keep shopping
          </ButtonLink>
        </div>

        <p className="mt-5 text-[0.82rem] leading-relaxed text-muted">
          Buying ten or more of anything?{" "}
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="border-b border-muted hover:border-live hover:text-live"
          >
            Message us on WhatsApp
          </a>{" "}
          before you pay.
        </p>
      </aside>
    </div>
  );
}
