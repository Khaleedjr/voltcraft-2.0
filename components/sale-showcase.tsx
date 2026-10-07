import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { StockPill } from "@/components/ui";
import { maxOrderable, priceLabel, stockLabel, type Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

/** What a sale saves, in naira: on a big-ticket line that says more than "−2%". */
const saving = (p: Product) => (p.compareAt && p.compareAt > p.price ? p.compareAt - p.price : 0);

/**
 * A ticker of what is on sale, running the width of the page in the brand
 * gold. It is the one loud thing on the page and earns it: every item is real
 * and links to its product. The run is drawn twice and slid by half its width,
 * so the loop has no seam; it pauses under the pointer so a link can be taken,
 * and stands still under reduced motion. See .vc-ticker in globals.css.
 */
export function SaleTicker({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  const run = (copy: number) => (
    <ul className="vc-ticker-run" aria-hidden={copy > 0 ? true : undefined}>
      {products.map((p) => (
        <li key={`${copy}-${p.slug}`} className="flex items-center gap-3 whitespace-nowrap">
          <Bolt />
          <Link href={`/product/${p.slug}`} tabIndex={copy > 0 ? -1 : undefined} className="hover:underline">
            {p.name}
          </Link>
          <span className="font-semibold">{formatNaira(p.price)}</span>
          {p.compareAt ? <span className="line-through opacity-60">{formatNaira(p.compareAt)}</span> : null}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="vc-ticker border-y border-line bg-gold text-live-ink" role="region" aria-label="On sale now">
      <div className="vc-ticker-track">
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}

/**
 * The sale, as a spotlight and a short list instead of a grid of boxes: the
 * lead deal large with its photo and the button to buy it, the rest as rows
 * divided by hairlines, each one a link.
 */
export function SaleShowcase({ products }: { products: Product[] }) {
  const [lead, ...rest] = products;
  if (!lead) return null;
  const leadStock = stockLabel(lead);
  const leadSave = saving(lead);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
      <Reveal>
        <div className="group">
          <Link href={`/product/${lead.slug}`} className="relative block">
            <ProductImage
              product={lead}
              ratio="aspect-[4/3]"
              sizes="(max-width: 1024px) 100vw, 560px"
              pad="p-10"
            />
            {leadSave ? (
              <span className="vc-fig absolute left-0 top-0 z-10 bg-gold px-3 py-2 text-live-ink">
                Save {formatNaira(leadSave)}
              </span>
            ) : null}
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <Link href={`/product/${lead.slug}`} className="block">
                <h3 className="font-display text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight tracking-[-0.02em] transition-colors group-hover:text-live">
                  {lead.name}
                </h3>
              </Link>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {priceLabel(lead) ? <span className="vc-fig text-faint">{priceLabel(lead)}</span> : null}
                <span className="font-display text-[2rem] leading-none tabular-nums">{formatNaira(lead.price)}</span>
                {lead.compareAt ? (
                  <span className="text-[1rem] text-faint line-through tabular-nums">{formatNaira(lead.compareAt)}</span>
                ) : null}
                <StockPill text={leadStock.text} tone={leadStock.tone} />
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <AddToCart slug={lead.slug} stock={maxOrderable(lead)} hasOptions={Boolean(lead.variants?.length)} />
            </div>
          </div>
        </div>
      </Reveal>

      <ul className="border-t border-line">
        {rest.map((p, i) => {
          const save = saving(p);
          return (
            <li key={p.slug} className="border-b border-line">
              <Reveal delay={i * 70}>
                <Link
                  href={`/product/${p.slug}`}
                  className="vc-sale-row group grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-4 py-4 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:gap-5"
                >
                  <ProductImage product={p} ratio="aspect-square" sizes="104px" pad="p-2.5" />
                  <span className="min-w-0">
                    <span className="block font-display text-[1.08rem] leading-snug tracking-[-0.012em] transition-colors group-hover:text-live sm:text-[1.2rem]">
                      {p.name}
                    </span>
                    {save ? <span className="vc-fig mt-1.5 block text-live">Save {formatNaira(save)}</span> : null}
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-[1.15rem] tabular-nums sm:text-[1.35rem]">{formatNaira(p.price)}</span>
                    {p.compareAt ? (
                      <span className="block text-[0.82rem] text-faint line-through tabular-nums">{formatNaira(p.compareAt)}</span>
                    ) : null}
                  </span>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Bolt() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden className="shrink-0">
      <path d="M6.5 0 0 8h4l-1 6 7-8.5H6z" fill="currentColor" />
    </svg>
  );
}
