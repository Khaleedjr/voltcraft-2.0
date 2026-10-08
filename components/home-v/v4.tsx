import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { HeroWorkshop } from "@/components/hero-workshop";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container, Section } from "@/components/ui";
import { maxOrderable } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";
import type { HomeData } from "@/lib/home-data";
import { SITE } from "@/lib/site";
import { Lamp } from "./lamp";
import { AisleIcon, LEDE, off, Talk } from "./parts";

/**
 * Version 4, night shift. The hero is the workshop after hours, dark in
 * either theme: the drawing glows, a lamp follows the pointer, a pulse runs
 * along a trace under it. The aisles are laid out like a circuit board, each
 * with its own icon that traces itself in on hover; the sale hangs as price
 * tags on a wire and swings when touched.
 */
export function HomeV4({ d }: { d: HomeData }) {
  return (
    <>
      <Lamp className="hv4-night relative overflow-hidden">
        <div aria-hidden className="vc-grid-ground pointer-events-none absolute inset-0" />
        <Container className="relative">
          <div className="grid items-center gap-8 pb-16 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:pb-20 lg:pt-20">
            <div>
              <p className="vc-fig flex items-center gap-2 text-live">
                <span className="hv4-dot" aria-hidden /> Open for orders
              </p>
              <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.8rem)] leading-[0.98] tracking-[-0.04em] text-ink">
                Everything your <span className="hv4-glow">build</span> needs.
              </h1>
              <p className="mt-6 max-w-[42ch] text-[1.02rem] leading-relaxed text-muted">{LEDE}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink href="/shop" className="group">
                  Shop all products <span className="vc-arrow" aria-hidden>→</span>
                </ButtonLink>
                <ButtonLink href={SITE.printingUrl} target="_blank" rel="noreferrer" variant="outline" className="group">
                  3D Printing <span className="vc-arrow" aria-hidden>→</span>
                </ButtonLink>
              </div>
              <p className="vc-fig mt-10 flex flex-wrap gap-x-6 gap-y-2 text-faint">
                <span>{d.inStock} parts in stock</span>
                <span>Free delivery over {formatNaira(SITE.freeDeliveryThreshold)}</span>
              </p>
            </div>
            <div className="hv4-art">
              <HeroWorkshop className="max-w-[600px]" />
            </div>
          </div>
        </Container>
        <Trace />
      </Lamp>

      {/* ------------------------------------------- the aisles, as a board */}
      <Container>
        <Section divide={false}>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.7rem)] leading-tight tracking-[-0.03em]">Pick an aisle</h2>
            <Link href="/shop" className="group border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
              All products <span className="vc-arrow" aria-hidden>→</span>
            </Link>
          </div>
          <ul className="hv4-board grid sm:grid-cols-2 lg:grid-cols-3">
            {d.categories.map((c, i) => (
              <li key={c.slug}>
                <Reveal delay={(i % 3) * 70} className="h-full">
                  <Link href={`/shop/${c.slug}`} className="hv4-cell group">
                    <span className="flex items-start justify-between gap-4">
                      <AisleIcon slug={c.slug} className="hv4-icon size-11" />
                      <span className="font-mono text-[0.8rem] tabular-nums text-faint">{String(d.counts[c.slug] ?? 0).padStart(2, "0")} parts</span>
                    </span>
                    <span className="mt-6 block font-display text-[1.55rem] leading-tight tracking-[-0.02em]">{c.name}</span>
                    <span className="mt-1.5 block text-[0.88rem] leading-snug text-muted">{c.blurb}</span>
                    <span className="vc-fig mt-5 inline-flex items-center gap-2 text-live">
                      Browse <span className="vc-arrow" aria-hidden>→</span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </Section>
      </Container>

      {/* ------------------------------------------ the sale, tags on a wire */}
      {d.sale.length ? (
        <div className="overflow-hidden border-y border-line bg-sheet">
          <Container>
            <Section divide={false}>
              <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.7rem)] leading-tight tracking-[-0.03em]">Price tags are down</h2>
              <div className="hv4-wire mt-6">
                <ul className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-6 pt-0 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
                  {d.sale.map((p, i) => (
                    <li key={p.slug} className="hv4-hang w-[230px] shrink-0 snap-start lg:w-auto" style={{ ["--tilt" as string]: `${i % 2 ? 2 : -2}deg` }}>
                      <span className="hv4-string" aria-hidden />
                      <article className="hv4-tag">
                        <span className="hv4-hole" aria-hidden />
                        <span className="vc-fig absolute right-3 top-3 z-10 bg-gold px-2 py-1 text-live-ink">−{off(p)}%</span>
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
            </Section>
          </Container>
        </div>
      ) : null}

      <Container>
        <Section divide={false}>
          <Reveal>
            <Talk />
          </Reveal>
        </Section>
      </Container>
    </>
  );
}

/** A trace across the foot of the hero, with a pulse of current running along it. */
function Trace() {
  const d = "M0 40H180L210 14H420L450 40H700L730 22H930L960 40H1200";
  return (
    <svg viewBox="0 0 1200 56" preserveAspectRatio="none" className="hv4-trace absolute inset-x-0 bottom-0 h-14 w-full" aria-hidden>
      <path d={d} fill="none" stroke="var(--vc-line)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <path className="hv4-pulse" d={d} fill="none" stroke="var(--vc-gold)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" pathLength={1000} />
    </svg>
  );
}
