import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { StockPill } from "@/components/ui";
import { discountPercent, maxOrderable, priceLabel, stockLabel, type Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const stock = stockLabel(product);
  const from = priceLabel(product);
  const off = discountPercent(product);

  return (
    <article className="flex flex-col gap-3 border border-line bg-raised p-4 transition-colors hover:border-ink">
      <Link href={`/product/${product.slug}`} className="group flex flex-col gap-3">
        <div className="relative">
          <ProductImage product={product} />
          {off ? (
            <span className="absolute left-0 top-0 bg-live px-2 py-1 font-mono text-[0.62rem] font-semibold tracking-wider text-live-ink">
              −{off}%
            </span>
          ) : null}
        </div>
        <h3 className="text-[0.95rem] font-semibold leading-snug group-hover:text-live">
          {product.name}
        </h3>
      </Link>
      <div className="mt-auto flex flex-col gap-3 pt-1">
        <StockPill text={stock.text} tone={stock.tone} />
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {from ? <span className="vc-fig text-faint">{from}</span> : null}
          <span className="font-display text-[1.35rem] tabular-nums">{formatNaira(product.price)}</span>
          {product.compareAt ? (
            <span className="text-[0.8rem] text-faint line-through tabular-nums">
              {formatNaira(product.compareAt)}
            </span>
          ) : null}
        </div>
        <AddToCart slug={product.slug} stock={maxOrderable(product)} size="compact" />
      </div>
    </article>
  );
}
