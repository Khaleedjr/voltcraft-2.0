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
} from "@/lib/cart-store";

export type { CartLine };
export type ResolvedLine = { product: LiteProduct; qty: number; lineTotal: number };

export type CartValue = {
  /** False until localStorage has been read, so server and client first paint agree. */
  ready: boolean;
  lines: CartLine[];
  items: ResolvedLine[];
  count: number;
  subtotal: number;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

export function useCart(): CartValue {
  const { lines, ready } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lookup = useCatalogue();

  return useMemo(() => {
    const items: ResolvedLine[] = lines.flatMap((line) => {
      const product = lookup(line.slug);
      if (!product) return [];
      return [{ product, qty: line.qty, lineTotal: product.price * line.qty }];
    });

    // Never below one, so a line can always be held while it is on sale;
    // zero for anything the catalogue no longer lists.
    const ceilingFor = (slug: string) => {
      const product = lookup(slug);
      return product ? Math.max(maxOrderable(product), 1) : 0;
    };

    return {
      ready,
      lines,
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.lineTotal, 0),
      add: (slug: string, qty = 1) => addLine(slug, qty, ceilingFor(slug)),
      setQty: (slug: string, qty: number) => setLineQty(slug, qty, ceilingFor(slug)),
      remove: removeLine,
      clear: clearCart,
    };
  }, [lines, ready, lookup]);
}
