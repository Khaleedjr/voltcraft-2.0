"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useCatalogue } from "@/components/catalogue-provider";
import { maxOrderable, type LiteProduct } from "@/lib/catalogue";
import {
  addLine,
  clearCart,
  getServerSnapshot,
  getSnapshot,
  removeLine,
  setLineQty,
  subscribe,
  type CartLine,
  type LineRef,
} from "@/lib/cart-store";
import { lineKey, priceOrder, stockPool, unitPriceFor, type PricedLine } from "@/lib/orders";

export type { CartLine, LineRef };
export type ResolvedLine = PricedLine<LiteProduct>;

export type CartValue = {
  /** False until localStorage has been read, so server and client first paint agree. */
  ready: boolean;
  lines: CartLine[];
  items: ResolvedLine[];
  count: number;
  subtotal: number;
  add: (ref: LineRef, qty?: number) => void;
  setQty: (ref: LineRef, qty: number) => void;
  remove: (ref: LineRef) => void;
  clear: () => void;
};

export function useCart(): CartValue {
  const { lines, ready } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lookup = useCatalogue();

  return useMemo(() => {
    // Priced exactly as the checkout will price it, so the count in the header
    // and the total at the till always agree.
    const order = priceOrder(lines, lookup);

    // A counted product's options share its shelf, so a line may grow only
    // into what the product's other lines have left (see stockPool). Never
    // below one while the line is alone, so it can always be held while it is
    // on sale; zero for anything the catalogue no longer sells in that option.
    const ceilingFor = (ref: LineRef) => {
      const product = lookup(ref.slug);
      if (!product || unitPriceFor(product, ref.variant) == null) return 0;
      const key = lineKey(ref);
      const pool = stockPool(product, ref.variant);
      const others = lines.reduce(
        (n, l) => (l.slug === ref.slug && lineKey(l) !== key && stockPool(product, l.variant) === pool ? n + l.qty : n),
        0,
      );
      const room = maxOrderable(product) - others;
      return others === 0 ? Math.max(room, 1) : Math.max(room, 0);
    };

    return {
      ready,
      lines,
      items: order.items,
      count: order.items.reduce((n, i) => n + i.qty, 0),
      subtotal: order.subtotal,
      add: (ref: LineRef, qty = 1) => addLine(ref, qty, ceilingFor(ref)),
      setQty: (ref: LineRef, qty: number) => setLineQty(ref, qty, ceilingFor(ref)),
      remove: removeLine,
      clear: clearCart,
    };
  }, [lines, ready, lookup]);
}
