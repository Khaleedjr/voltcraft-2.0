"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-context";
import { Button } from "@/components/ui";

export function AddKitToCart({ lines }: { lines: { slug: string; qty: number }[] }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <Button
      variant="live"
      onClick={() => {
        lines.forEach((l) => add(l.slug, l.qty));
        setAdded(true);
      }}
    >
      {added ? `Added ${lines.length} items ✓` : "Add the whole kit to cart"}
    </Button>
  );
}
