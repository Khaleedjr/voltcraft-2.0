import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import type { Category, CategorySlug, Product } from "@/lib/catalogue";

/**
 * The aisles as an index set in type, not a grid of boxes: every aisle name
 * large, its count in a mono superscript, a gold slash between them.
 *
 * With a pointer, hovering an aisle lifts a photo of something in it off the
 * line and dims the others, so the eye lands on one. Without hover (phones,
 * tablets) the same list stacks into rows, each with its photo beside the
 * name, because there is no hover to reveal it. See .vc-aisle* in globals.css.
 */
export function AisleIndex({
  categories,
  counts,
  thumbs,
}: {
  categories: Category[];
  counts: Partial<Record<CategorySlug, number>>;
  thumbs: Partial<Record<CategorySlug, Product>>;
}) {
  return (
    <ul className="vc-aisles">
      {categories.map((c, i) => {
        const thumb = thumbs[c.slug];
        return (
          <li key={c.slug} className="vc-aisle-item">
            <Reveal delay={i * 45}>
              <Link href={`/shop/${c.slug}`} className="vc-aisle group">
                {thumb ? (
                  <span className="vc-aisle-thumb" aria-hidden>
                    <ProductImage product={thumb} ratio="aspect-square" sizes="56px" pad="p-1.5" />
                  </span>
                ) : null}
                <span className="vc-aisle-name">{c.name}</span>
                <span className="vc-aisle-count">{counts[c.slug] ?? 0}</span>
                <span className="vc-aisle-arrow vc-arrow" aria-hidden>
                  →
                </span>
                {thumb ? (
                  <span className="vc-aisle-pop" aria-hidden>
                    <ProductImage product={thumb} ratio="aspect-square" sizes="168px" pad="p-4" />
                  </span>
                ) : null}
              </Link>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}
