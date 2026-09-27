import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { StockPill } from "@/components/ui";
import { discountPercent, maxOrderable, priceLabel, stockLabel, type Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

/**
 * A product in a listing: photo, name, stock, price, add to cart. The saving
 * sits beside the price rather than over the photo, so nothing covers the part
 * the customer is trying to see.
 */
export function ProductCard({ product }: { product: Product }) {
  const stock = stockLabel(product);
  const from = priceLabel(product);
  const off = discountPercent(product);

  return (
    <article className="vc-lift flex h-full flex-col gap-4 rounded-2xl border border-line-soft bg-raised p-3 pb-4">
      <Link href={`/product/${product.slug}`} className="group flex flex-col gap-3">
        <ProductImage product={product} ratio="aspect-square" pad="p-5" />
        <h3 className="px-1 text-[0.95rem] font-medium leading-snug text-ink transition-colors group-hover:text-live">
          {product.name}
        </h3>
      </Link>
      <div className="mt-auto flex flex-col gap-3 px-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {from ? <span className="text-[0.78rem] text-faint">{from}</span> : null}
          <span className="font-display text-[1.3rem] font-semibold tracking-[-0.02em] tabular-nums">{formatNaira(product.price)}</span>
          {product.compareAt ? (
            <span className="text-[0.8rem] text-faint line-through tabular-nums">{formatNaira(product.compareAt)}</span>
          ) : null}
          {off ? <span className="text-[0.78rem] font-semibold text-live">Save {off}%</span> : null}
        </div>
        <StockPill text={stock.text} tone={stock.tone} />
        <AddToCart
          slug={product.slug}
          stock={maxOrderable(product)}
          hasOptions={Boolean(product.variants?.length)}
          size="compact"
        />
      </div>
    </article>
  );
}
