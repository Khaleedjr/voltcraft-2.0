import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { ProductPlate } from "@/components/product-plate";
import { StockPill } from "@/components/ui";
import { stockLabel, type Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const stock = stockLabel(product.stock);
  return (
    <article className="flex flex-col gap-3 border border-line bg-raised p-4 transition-colors hover:border-ink">
      <Link href={`/product/${product.slug}`} className="group flex flex-col gap-3">
        <ProductPlate category={product.category} sku={product.sku} />
        <h3 className="text-[0.95rem] font-semibold leading-snug group-hover:text-live">
          {product.name}
        </h3>
      </Link>
      <p className="line-clamp-2 text-[0.82rem] leading-relaxed text-muted">{product.summary}</p>
      <div className="mt-auto flex flex-col gap-3 pt-1">
        <StockPill text={stock.text} tone={stock.tone} />
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[1.35rem] tabular-nums">{formatNaira(product.price)}</span>
          {product.compareAt ? (
            <span className="text-[0.8rem] text-faint line-through tabular-nums">
              {formatNaira(product.compareAt)}
            </span>
          ) : null}
        </div>
        <AddToCart slug={product.slug} stock={product.stock} size="compact" />
      </div>
    </article>
  );
}
