"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-context";

/** Empties the cart once an order is confirmed paid. */
export function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
