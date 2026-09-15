import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { discountPercent, primaryCategory, getCategory, type Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

/**
 * The hero's product display: one clean feature card with a fully-visible row
 * of thumbnails beneath it. No overlap, nothing hidden — every product reads
 * clearly. Each is a real, clickable product card.
 */
export function HeroShowcase({ products }: { products: Product[] }) {
  const items = products.slice(0, 4);
  if (items.length === 0) return null;

  const [feature, ...rest] = items;
  const thumbs = rest.slice(0, 3);
  const category = getCategory(primaryCategory(feature));
  const off = discountPercent(feature);

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col gap-4">
      {/* feature card */}
      <Link
        href={`/product/${feature.slug}`}
        className="vc-lift group block overflow-hidden rounded-xl border border-line bg-raised shadow-[0_24px_60px_-30px_rgba(var(--vc-shadow),0.45)]"
      >
        <div className="relative">
          <ProductImage product={feature} ratio="aspect-[4/3]" sizes="(max-width:1024px) 90vw, 440px" priority pad="p-6" />
          {off ? (
            <span className="absolute left-3 top-3 z-10 rounded-sm bg-live px-2 py-1 font-mono text-[0.62rem] font-semibold tracking-wider text-live-ink shadow-sm">
              −{off}%
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3.5">
          <div className="min-w-0">
            {category ? <span className="vc-fig block text-faint">{category.name}</span> : null}
            <span className="mt-0.5 block truncate text-[0.95rem] font-semibold leading-snug transition-colors group-hover:text-live">
              {feature.name}
            </span>
          </div>
          <div className="shrink-0 text-right">
            <span className="block font-display text-[1.15rem] tracking-[-0.015em] tabular-nums">
              {formatNaira(feature.price)}
            </span>
            {feature.compareAt ? (
              <span className="block text-[0.72rem] text-faint line-through tabular-nums">
                {formatNaira(feature.compareAt)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* thumbnail row */}
      {thumbs.length ? (
        <ul className="grid grid-cols-3 gap-3">
          {thumbs.map((p) => {
            const thumbOff = discountPercent(p);
            return (
              <li key={p.slug}>
                <Link
                  href={`/product/${p.slug}`}
                  aria-label={p.name}
                  className="vc-lift group block rounded-lg border border-line bg-raised p-2"
                >
                  <div className="relative">
                    <ProductImage product={p} ratio="aspect-square" sizes="150px" pad="p-2" />
                    {thumbOff ? (
                      <span className="absolute left-1.5 top-1.5 z-10 rounded-sm bg-live px-1.5 py-0.5 font-mono text-[0.55rem] font-semibold text-live-ink">
                        −{thumbOff}%
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-1.5 block px-0.5 font-display text-[0.85rem] tabular-nums">
                    {formatNaira(p.price)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
