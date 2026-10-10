import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { discountPercent, maxOrderable, type Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

/**
 * The sale as price tags hanging from a wire, each on its string, tilted a
 * little either way and swaying on its own beat, swinging harder when touched
 * or tapped (.vc-tag* in globals.css).
 * They run across the page on a wide screen and scroll sideways on a phone.
 */
export function SaleTags({ products }: { products: Product[] }) {
  return (
    <div className="vc-wire">
      <ul className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-6 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {products.map((p, i) => (
          <li
            key={p.slug}
            className="vc-tag-hang w-[230px] shrink-0 snap-start lg:w-auto"
            style={{
              ["--tilt" as string]: `${i % 2 ? 2 : -2}deg`,
              // each tag on its own beat, so they never sway in step
              ["--sway" as string]: `${4 + (i % 3) * 0.7}s`,
              ["--sway-delay" as string]: `${-i * 1.3}s`,
            }}
          >
            <span className="vc-tag-string" aria-hidden />
            <article className="vc-tag">
              <span className="vc-tag-hole" aria-hidden />
              {discountPercent(p) ? (
                <span className="vc-fig absolute right-3 top-3 z-10 bg-gold px-2 py-1 text-live-ink">−{discountPercent(p)}%</span>
              ) : null}
              <Link href={`/product/${p.slug}`} className="group block">
                <ProductImage product={p} ratio="aspect-square" sizes="240px" pad="p-4" />
                <h3 className="mt-3 text-[0.92rem] font-semibold leading-snug group-hover:text-live">{p.name}</h3>
              </Link>
              <p className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="font-display text-[1.4rem] tabular-nums">{formatNaira(p.price)}</span>
                {p.compareAt ? <span className="text-[0.8rem] text-faint line-through tabular-nums">{formatNaira(p.compareAt)}</span> : null}
              </p>
              <div className="mt-3">
                <AddToCart slug={p.slug} stock={maxOrderable(p)} hasOptions={Boolean(p.variants?.length)} size="compact" />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
