import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import type { Category, CategorySlug, Product } from "@/lib/catalogue";

/**
 * The categories as rows, each led by a fan of three of its parts that
 * spreads apart when pointed at (.vc-fan in globals.css). One column on a
 * phone, two side by side on a wide screen.
 */
export function CategoryFans({
  categories,
  counts,
  shots,
}: {
  categories: Category[];
  counts: Partial<Record<CategorySlug, number>>;
  shots: Partial<Record<CategorySlug, Product[]>>;
}) {
  return (
    <ul className="grid border-t border-line lg:grid-cols-2 lg:gap-x-12">
      {categories.map((c, i) => (
        <li key={c.slug} className="border-b border-line">
          <Reveal delay={(i % 4) * 40}>
            <Link href={`/shop/${c.slug}`} className="vc-fan-row group">
              <span className="vc-fan" aria-hidden>
                {(shots[c.slug] ?? []).slice(0, 3).map((p, k) => (
                  <span key={p.slug} className={`vc-fan-card vc-fan-card-${k}`}>
                    <ProductImage product={p} ratio="aspect-square" sizes="96px" pad="p-2" />
                  </span>
                ))}
              </span>
              <span className="vc-fan-text min-w-0">
                <span className="flex items-baseline gap-3">
                  <span className="font-display text-[1.45rem] leading-tight tracking-[-0.02em] group-hover:text-live">{c.name}</span>
                  <span className="font-mono text-[0.78rem] tabular-nums text-faint">{counts[c.slug] ?? 0}</span>
                </span>
                <span className="mt-1 block text-[0.88rem] leading-snug text-muted">{c.blurb}</span>
              </span>
              <span className="vc-arrow text-[1.1rem]" aria-hidden>
                →
              </span>
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
