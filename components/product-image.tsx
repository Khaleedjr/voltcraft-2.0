"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductPlate } from "@/components/product-plate";
import { primaryCategory, type Product } from "@/lib/catalogue";

/**
 * Product photography, with a drawing-sheet plate as the fallback.
 *
 * The fallback is not decoration: the media library has refused requests from
 * other origins before, and a listing with a white void in it looks broken in a
 * way a labelled plate does not. Any image that fails to load — missing file,
 * hotlink protection, a format the browser will not decode — degrades quietly.
 */
export function ProductImage({
  product,
  ratio = "aspect-[4/3]",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px",
  priority = false,
  index = 0,
}: {
  product: Product;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  index?: number;
}) {
  const [failed, setFailed] = useState(false);
  const src = product.images[index];

  if (!src || failed) {
    return <ProductPlate category={primaryCategory(product)} label={product.name} ratio={ratio} />;
  }

  return (
    <div className={`relative ${ratio} w-full max-w-full overflow-hidden border border-line bg-raised`}>
      <Image
        src={src}
        alt={product.name}
        fill
        sizes={sizes}
        priority={priority}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="object-contain p-3"
      />
    </div>
  );
}
