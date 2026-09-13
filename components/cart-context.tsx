"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getProduct, type Product } from "@/lib/catalogue";
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
export type ResolvedLine = { product: Product; qty: number; lineTotal: number };

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

  return useMemo(() => {
    const items: ResolvedLine[] = lines.flatMap((line) => {
      const product = getProduct(line.slug);
      if (!product) return [];
      return [{ product, qty: line.qty, lineTotal: product.price * line.qty }];
    });
    return {
      ready,
      lines,
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.lineTotal, 0),
      add: addLine,
      setQty: setLineQty,
      remove: removeLine,
      clear: clearCart,
    };
  }, [lines, ready]);
}
