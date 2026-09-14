"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductPlate } from "@/components/product-plate";
import { primaryCategory, type Product } from "@/lib/catalogue";

export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<Set<number>>(new Set());
  // Anything the browser refuses to load drops out of the gallery entirely,
  // rather than leaving a blank frame or a dead thumbnail behind.
  const images = product.images.filter((_, i) => !broken.has(i));

  if (images.length === 0) {
    return (
      <ProductPlate category={primaryCategory(product)} label={product.name} ratio="aspect-[5/4]" />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[5/4] w-full max-w-full overflow-hidden border border-line bg-raised">
        <Image
          src={images[Math.min(active, images.length - 1)]}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 520px"
          referrerPolicy="no-referrer"
          onError={() => setBroken((prev) => new Set(prev).add(active))}
          className="object-contain p-6"
        />
      </div>
      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${images.length}`}
                aria-current={i === active ? "true" : undefined}
                className={`relative size-16 overflow-hidden border bg-raised transition-colors ${
                  i === active ? "border-ink" : "border-line hover:border-muted"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="64px"
                  referrerPolicy="no-referrer"
                  onError={() => setBroken((prev) => new Set(prev).add(i))}
                  className="object-contain p-1.5"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
