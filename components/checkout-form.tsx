"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-context";
import { useCatalogue } from "@/components/catalogue-provider";
import { ButtonLink, Button, Fig } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import { priceOrder, STATES } from "@/lib/orders";
import { SITE } from "@/lib/site";

const fieldClass =
  "w-full border border-line bg-raised px-3.5 py-2.5 text-[0.92rem] text-ink outline-none transition-colors placeholder:text-faint focus:border-ink";

type CheckoutResponse = {
  ok?: boolean;
  error?: string;
  mode?: "manual" | "paystack";
  reference?: string;
  authorizationUrl?: string;
};

export function CheckoutForm() {
  const router = useRouter();
  const { lines, ready, clear } = useCart();
  const lookup = useCatalogue();
  const order = priceOrder(lines, lookup);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return <p className="py-10 text-[0.92rem] text-muted">Loading your order…</p>;
  }

  if (order.items.length === 0) {
    return (
      <div className="border border-line bg-sheet p-10 text-center">
        <p className="font-display text-[1.6rem] tracking-[-0.022em]">There&apos;s nothing to check out.</p>
        <p className="mx-auto mt-3 max-w-[42ch] text-[0.93rem] leading-relaxed text-muted">
          Add something to the cart first and this page will have some work to do.
        </p>
        <div className="mt-7 flex justify-center">
          <ButtonLink href="/shop">Browse the catalogue</ButtonLink>
        </div>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const customer = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines, customer }),
      });
      const json: CheckoutResponse = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      if (json.mode === "paystack" && json.authorizationUrl) {
        // The cart is cleared on the callback page, once payment is confirmed.
        window.location.href = json.authorizationUrl;
        return;
      }
      clear();
      router.push(`/checkout/received?ref=${encodeURIComponent(json.reference ?? "")}`);
    } catch {
      setError("Network problem — please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
      <div>
        <Fig>Delivery details</Fig>
        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-name" className="vc-fig mb-2 block text-muted">
                Full name
              </label>
              <input id="co-name" name="name" required autoComplete="name" className={fieldClass} placeholder="Ada Okoro" />
            </div>
            <div>
              <label htmlFor="co-phone" className="vc-fig mb-2 block text-muted">
                Phone
              </label>
              <input id="co-phone" name="phone" required inputMode="tel" autoComplete="tel" className={fieldClass} placeholder="080 0000 0000" />
            </div>
          </div>
          <div>
            <label htmlFor="co-email" className="vc-fig mb-2 block text-muted">
              Email — the receipt goes here
            </label>
            <input id="co-email" name="email" type="email" required autoComplete="email" className={fieldClass} placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="co-address" className="vc-fig mb-2 block text-muted">
              Delivery address
            </label>
            <input id="co-address" name="address" required autoComplete="street-address" className={fieldClass} placeholder="14 Herbert Macaulay Way, Yaba" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-city" className="vc-fig mb-2 block text-muted">
                City
              </label>
              <input id="co-city" name="city" required autoComplete="address-level2" className={fieldClass} placeholder="Kaduna" />
            </div>
            <div>
              <label htmlFor="co-state" className="vc-fig mb-2 block text-muted">
                State
              </label>
              <select id="co-state" name="state" required defaultValue="Kaduna" className={fieldClass}>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="co-notes" className="vc-fig mb-2 block text-muted">
              Delivery notes <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <textarea id="co-notes" name="notes" rows={3} maxLength={1000} className={`${fieldClass} resize-y`} placeholder="Landmark, gate code, best time to call" />
          </div>
        </div>
      </div>

      <aside className="h-max border border-line bg-sheet p-6">
        <Fig>Your order</Fig>
        <ul className="mt-4 border-t border-line">
          {order.items.map(({ product, qty, lineTotal }) => (
            <li key={product.slug} className="flex justify-between gap-4 border-b border-line py-3 text-[0.88rem]">
              <span className="min-w-0">
                <Link href={`/product/${product.slug}`} className="hover:text-live">
                  {product.name}
                </Link>
                <span className="vc-fig mt-1 block text-faint">×{qty}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatNaira(lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-2.5 text-[0.9rem]">
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
          <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3.5">
            <dt className="font-semibold">Total</dt>
            <dd className="font-display text-[1.6rem] tabular-nums">{formatNaira(order.total)}</dd>
          </div>
        </dl>

        {error ? (
          <p role="alert" className="mt-5 border-l-2 border-live pl-3 text-[0.87rem] leading-relaxed text-muted">
            {error}{" "}
            <a href={SITE.phoneHref} className="border-b border-live text-ink hover:text-live">
              {SITE.phone}
            </a>
          </p>
        ) : null}

        <div className="mt-6">
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Starting payment…" : `Pay ${formatNaira(order.total)}`}
          </Button>
        </div>
        <p className="mt-4 text-[0.8rem] leading-relaxed text-muted">
          Payment is handled by Paystack — card, bank transfer or USSD. We never see your card
          details.
        </p>
      </aside>
    </form>
  );
}
