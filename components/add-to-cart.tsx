"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-context";
import { Button, ButtonLink } from "@/components/ui";

/**
 * One tap to the cart. A product sold in options (resistor values, slot
 * counts) cannot be added blind, so it sends people to its page to choose.
 */
export function AddToCart({
  slug,
  stock,
  hasOptions = false,
  size = "default",
}: {
  slug: string;
  stock: number;
  hasOptions?: boolean;
  size?: "default" | "compact";
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  if (stock <= 0) {
    return (
      <Button variant="outline" disabled className={size === "compact" ? "w-full !py-2.5" : ""}>
        Out of stock
      </Button>
    );
  }

  if (hasOptions) {
    return (
      <ButtonLink
        href={`/product/${slug}`}
        variant={size === "compact" ? "outline" : "live"}
        className={size === "compact" ? "w-full !py-2.5" : ""}
      >
        Choose option
      </ButtonLink>
    );
  }

  return (
    <Button
      variant={size === "compact" ? "outline" : "live"}
      className={size === "compact" ? "w-full !py-2.5" : ""}
      onClick={() => {
        add({ slug }, 1);
        setAdded(true);
      }}
    >
      {added ? "Added ✓" : "Add to cart"}
    </Button>
  );
}
