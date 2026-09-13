"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-context";
import { Button } from "@/components/ui";

export function AddToCart({
  slug,
  stock,
  size = "default",
}: {
  slug: string;
  stock: number;
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

  return (
    <Button
      variant={size === "compact" ? "outline" : "live"}
      className={size === "compact" ? "w-full !py-2.5" : ""}
      onClick={() => {
        add(slug, 1);
        setAdded(true);
      }}
    >
      {added ? "Added ✓" : "Add to cart"}
    </Button>
  );
}
