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
import { CountUp } from "./count-up";
import { KitPanel, LEDE, off, saving, Talk } from "./parts";
import { FREE_DELIVERY_FROM } from "@/lib/delivery";

/**
 * Version 1, the drawing sheet. The workshop is the drawing, framed as a
 * sheet with numbered callouts on its parts and a title block under it; the
 * aisles are the bill of materials; the sale is a row of dimensioned parts.
 */
export function HomeV1({ d }: { d: HomeData }) {
  return (
    <>
      <div className="relative overflow-hidden">
        <div aria-hidden className="vc-wash-hero pointer-events-none absolute inset-0 -z-10 opacity-70" />
        <Container>
          <div className="grid items-center gap-8 pb-8 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-14 lg:pt-16">
            <div className="hv1-sheet relative order-2 border border-line bg-sheet p-3 sm:p-6 lg:order-1">
              <span className="hv1-sheet-tag vc-fig">Fig. 1 · The workshop</span>
              <HeroWorkshop className="max-w-[560px]" />
              <Callout n="01" at="hv1-c1" title="The printer" text="3D printing, quoted per job" href={SITE.printingUrl} external />
              <Callout n="02" at="hv1-c2" title="The arm" text={`Actuators · ${d.counts.actuators} parts`} href="/shop/actuators" />
              <Callout n="03" at="hv1-c3" title="The robot" text="Built from parts we stock" href="/shop" />
            </div>
            <div className="order-1 lg:order-2">
              <p className="vc-fig text-live">Sheet 01 · Parts for makers</p>
              <h1 className="mt-4 font-display text-[clamp(2.5rem,5.6vw,4.5rem)] leading-[1.0] tracking-[-0.038em]">
                Everything your <span className="hv1-mark">build</span> needs.
              </h1>
              <p className="mt-5 max-w-[40ch] text-[1.02rem] leading-relaxed text-muted">{LEDE}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink href="/shop" className="group">
                  Shop all products <span className="vc-arrow" aria-hidden>→</span>
                </ButtonLink>
                <ButtonLink href={SITE.printingUrl} target="_blank" rel="noreferrer" variant="underline" className="group">
                  3D Printing <span className="vc-arrow" aria-hidden>→</span>
                </ButtonLink>
              </div>
            </div>
          </div>

          {/* the title block, as on the corner of a drawing */}
          <dl className="hv1-title mb-4 grid grid-cols-2 border border-line bg-raised lg:grid-cols-4">
            <div>
              <dt>Parts on the shelf</dt>
              <dd>
                <CountUp to={d.inStock} />
              </dd>
            </div>
            <div>
              <dt>Categories</dt>
              <dd>
                <CountUp to={d.categories.length} />
              </dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd className="text-[1.05rem]!">Free over {formatNaira(FREE_DELIVERY_FROM)}</dd>
            </div>
            <div>
              <dt>Drawn in</dt>
              <dd className="text-[1.05rem]!">{SITE.city}</dd>
            </div>
          </dl>
        </Container>
      </div>

      {/* --------------------------------------------- the bill of materials */}
      <Container>
        <Section divide={false}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="vc-fig text-live">Fig. 2 · Shop by category</p>
              <h2 className="mt-3 font-display text-[clamp(1.7rem,3.2vw,2.5rem)] leading-tight tracking-[-0.025em]">Bill of materials</h2>
            </div>
            <Link href="/shop" className="group border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
              All products <span className="vc-arrow" aria-hidden>→</span>
            </Link>
          </div>
          <div className="hv1-bom-head vc-fig hidden text-faint md:grid">
            <span>No.</span>
            <span>Category</span>
            <span>What is in it</span>
            <span className="text-right">Parts</span>
            <span />
          </div>
          <ol className="border-t border-ink">
            {d.categories.map((c, i) => {
              const thumb = d.thumbs[c.slug];
              return (
                <li key={c.slug} className="border-b border-line">
                  <Reveal delay={i * 40}>
                    <Link href={`/shop/${c.slug}`} className="hv1-bom-row group">
                      <span className="vc-fig text-faint">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-display text-[1.3rem] leading-tight tracking-[-0.02em] sm:text-[1.55rem]">{c.name}</span>
                      <span className="hidden text-[0.9rem] text-muted md:block">{c.blurb}</span>
                      <span className="text-right font-mono text-[0.9rem] tabular-nums">{d.counts[c.slug] ?? 0}</span>
                      <span className="vc-arrow text-right" aria-hidden>
                        →
                      </span>
                      {thumb ? (
                        <span className="hv1-bom-pop" aria-hidden>
                          <ProductImage product={thumb} ratio="aspect-square" sizes="120px" pad="p-2.5" />
                        </span>
                      ) : null}
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </Section>
      </Container>

      {/* ----------------------------------------------- the sale, dimensioned */}
      {d.sale.length ? (
        <div className="border-y border-line bg-sheet">
          <Container>
            <Section divide={false}>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="vc-fig text-live">Fig. 3 · Revised prices</p>
                  <h2 className="mt-3 font-display text-[clamp(1.7rem,3.2vw,2.5rem)] leading-tight tracking-[-0.025em]">On sale now</h2>
                </div>
                <p className="vc-fig text-faint">Scroll →</p>
              </div>
              <div className="hv1-rail -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
                {d.sale.map((p, i) => (
                  <Reveal key={p.slug} delay={i * 70} className="w-[250px] shrink-0 snap-start lg:w-auto">
                    <article className="hv1-part group flex h-full flex-col">
                      <Link href={`/product/${p.slug}`} className="relative block">
                        <ProductImage product={p} ratio="aspect-square" sizes="260px" pad="p-5" />
                        <span className="hv1-tick hv1-tick-a" aria-hidden />
                        <span className="hv1-tick hv1-tick-b" aria-hidden />
                      </Link>
                      <p className="vc-dim vc-fig mt-3 text-live">
                        <span>−{off(p)}%</span>
                      </p>
                      <h3 className="mt-2 text-[0.95rem] font-semibold leading-snug">
                        <Link href={`/product/${p.slug}`} className="hover:text-live">
                          {p.name}
                        </Link>
                      </h3>
                      <div className="mt-auto pt-3">
                        <p className="flex flex-wrap items-baseline gap-2">
                          <span className="font-display text-[1.5rem] tabular-nums">{formatNaira(p.price)}</span>
                          {p.compareAt ? <span className="text-[0.82rem] text-faint line-through tabular-nums">{formatNaira(p.compareAt)}</span> : null}
                        </p>
                        <p className="vc-fig mt-1 text-faint">Save {formatNaira(saving(p))}</p>
                        <div className="mt-3">
                          <AddToCart slug={p.slug} stock={maxOrderable(p)} hasOptions={Boolean(p.variants?.length)} size="compact" />
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </Section>
          </Container>
        </div>
      ) : null}

      <Container>
        <Section divide={false}>
          <KitPanel kit={d.kit} />
        </Section>
        <Section>
          <Reveal>
            <Talk />
          </Reveal>
        </Section>
      </Container>
    </>
  );
}

function Callout({
  n,
  at,
  title,
  text,
  href,
  external = false,
}: {
  n: string;
  at: string;
  title: string;
  text: string;
  href: string;
  external?: boolean;
}) {
  const body = (
    <>
      <span className="vc-fig text-live">
        {n} · {title}
      </span>
      <span className="mt-1 block text-[0.82rem] font-semibold leading-snug">{text}</span>
    </>
  );
  const cls = `hv1-callout ${at} group`;
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}
