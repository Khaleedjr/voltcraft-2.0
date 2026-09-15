import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { discountPercent, type Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

/**
 * The hero's product display: three cards fanned into a shallow stack, the
 * middle one brought forward as the feature. Each is a real, clickable product
 * card — image, name and price contained in the card rather than floating as a
 * bare box. On phones the stack collapses to a single feature card, so the
 * rotations never clip or crowd.
 */
export function HeroShowcase({ products }: { products: Product[] }) {
  const stack = products.slice(0, 3);
  if (stack.length === 0) return null;

  const feature = stack[Math.min(1, stack.length - 1)];
  const behind = stack.filter((p) => p !== feature);

  return (
    <div className="relative mx-auto w-full max-w-[380px] sm:max-w-[440px]">
      {/* the two cards peeking out behind, on wider screens only */}
      {behind.map((p, i) => (
        <Link
          key={p.slug}
          href={`/product/${p.slug}`}
          aria-label={p.name}
          className="group absolute inset-x-0 top-4 hidden sm:block"
          style={{
            transform: i === 0 ? "rotate(-7deg) translateX(-16%)" : "rotate(7deg) translateX(16%)",
            zIndex: 10,
          }}
        >
          <HeroCard product={p} compact />
        </Link>
      ))}

      {/* the feature card, front and centre */}
      <Link href={`/product/${feature.slug}`} className="group relative z-20 block">
        <HeroCard product={feature} />
      </Link>
    </div>
  );
}

function HeroCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const off = discountPercent(product);
  return (
    <div className="vc-lift rounded-xl border border-line bg-raised p-3 shadow-[0_20px_50px_-24px_rgba(14,34,51,0.45)]">
      <div className="relative">
        <ProductImage product={product} ratio="aspect-square" sizes="(max-width:1024px) 70vw, 360px" priority />
        {off ? (
          <span className="absolute left-2 top-2 z-10 rounded-sm bg-live px-2 py-1 font-mono text-[0.62rem] font-semibold tracking-wider text-live-ink shadow-sm">
            −{off}%
          </span>
        ) : null}
      </div>
      {!compact ? (
        <div className="mt-3 flex items-center justify-between gap-3 px-1 pb-0.5">
          <span className="truncate text-[0.9rem] font-semibold leading-snug transition-colors group-hover:text-live">
            {product.name}
          </span>
          <span className="shrink-0 font-display text-[1.05rem] tracking-[-0.015em] tabular-nums">
            {formatNaira(product.price)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
