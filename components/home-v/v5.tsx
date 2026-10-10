import Link from "next/link";
import { HeroWorkshop } from "@/components/hero-workshop";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { SaleTicker } from "@/components/sale-showcase";
import { ButtonLink, Container, Section } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import type { HomeData } from "@/lib/home-data";
import { SITE } from "@/lib/site";
import { LEDE, off, saving, Talk } from "./parts";

/**
 * Version 5, the shop window. The products lead: the ticker on top, the
 * headline beside a window that turns through the best three deals on its
 * own (CSS only), the next three as picks under the headline. The aisles are
 * a mosaic of photographs; the workshop moves down to sell the print
 * service; the boards get a row of their own.
 */
export function HomeV5({ d }: { d: HomeData }) {
  const windowed = d.sale.slice(0, 3);
  const picks = d.sale.slice(3, 5).concat(d.ticker.filter((p) => !d.sale.includes(p)).slice(0, 1));
  // the mosaic gives its big tiles to the biggest aisles
  const rank = [...d.categories].sort((a, b) => (d.counts[b.slug] ?? 0) - (d.counts[a.slug] ?? 0)).map((c) => c.slug);
  const size = (slug: string) => ["hv5-big", "hv5-big", "hv5-wide"][rank.indexOf(slug as (typeof rank)[number])] ?? "";
  return (
    <>
      <SaleTicker products={d.ticker} />
      <div className="relative overflow-hidden">
        <div aria-hidden className="vc-wash-hero pointer-events-none absolute inset-0 -z-10 opacity-70" />
        <Container>
          <div className="grid items-start gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:py-16">
            <div className="lg:pt-6">
              <h1 className="font-display text-[clamp(2.4rem,5vw,4.1rem)] leading-[1.0] tracking-[-0.038em]">Everything your build needs.</h1>
              <p className="mt-5 max-w-[42ch] text-[1.02rem] leading-relaxed text-muted">{LEDE}</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <ButtonLink href="/shop" className="group">
                  Shop all products <span className="vc-arrow" aria-hidden>→</span>
                </ButtonLink>
                <ButtonLink href={SITE.printingUrl} target="_blank" rel="noreferrer" variant="underline" className="group">
                  3D Printing <span className="vc-arrow" aria-hidden>→</span>
                </ButtonLink>
              </div>
              {picks.length ? (
                <div className="mt-10">
                  <p className="vc-fig text-faint">Also on sale</p>
                  <ul className="mt-3 border-t border-line">
                    {picks.map((p) => (
                      <li key={p.slug} className="border-b border-line">
                        <Link href={`/product/${p.slug}`} className="group grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 py-3">
                          <ProductImage product={p} ratio="aspect-square" sizes="64px" pad="p-1.5" />
                          <span className="min-w-0 truncate text-[0.95rem] font-semibold group-hover:text-live">{p.name}</span>
                          <span className="text-right">
                            <span className="block font-display text-[1.1rem] tabular-nums">{formatNaira(p.price)}</span>
                            <span className="vc-fig block text-live">−{off(p)}%</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* the window: three deals in turn */}
            <div className="hv5-window relative border border-line bg-raised p-3 sm:p-4" style={{ ["--n" as string]: windowed.length }}>
              <div className="relative aspect-[4/5] sm:aspect-[5/5]">
                {windowed.map((p, i) => (
                  <Link
                    key={p.slug}
                    href={`/product/${p.slug}`}
                    className="hv5-slide group absolute inset-0 flex flex-col"
                    style={{ animationDelay: `${i * 4}s` }}
                    tabIndex={i === 0 ? undefined : -1}
                  >
                    <div className="relative min-h-0 flex-1">
                      <ProductImage product={p} ratio="h-full" sizes="(max-width: 1024px) 100vw, 560px" pad="p-10" priority={i === 0} />
                      <span className="hv5-stamp" aria-hidden>
                        <span className="font-display text-[1.6rem] leading-none">−{off(p)}%</span>
                        <span className="vc-fig mt-1">Sale</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line px-1 pt-4">
                      <span className="min-w-0">
                        <span className="vc-fig block text-faint">Deal {i + 1} of {windowed.length}</span>
                        <span className="mt-1 block font-display text-[1.35rem] leading-tight tracking-[-0.02em] group-hover:text-live">{p.name}</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-display text-[1.7rem] leading-none tabular-nums">{formatNaira(p.price)}</span>
                        <span className="vc-fig mt-1 block text-live">Save {formatNaira(saving(p))}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden>
                {windowed.map((p, i) => (
                  <span key={p.slug} className="hv5-pip" style={{ animationDelay: `${i * 4}s` }} />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* ------------------------------------------- the aisles, as a mosaic */}
      <Container>
        <Section>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(1.7rem,3.4vw,2.6rem)] leading-tight tracking-[-0.03em]">Shop by category</h2>
            <Link href="/shop" className="group border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
              All products <span className="vc-arrow" aria-hidden>→</span>
            </Link>
          </div>
          <ul className="hv5-mosaic">
            {d.categories.map((c, i) => {
              const t = d.thumbs[c.slug];
              return (
                <li key={c.slug} className={size(c.slug)}>
                  <Reveal delay={(i % 4) * 60} className="h-full">
                    <Link href={`/shop/${c.slug}`} className="hv5-tile group">
                      {t ? <ProductImage product={t} ratio="h-full" sizes="(max-width: 768px) 50vw, 400px" pad="p-6" /> : null}
                      <span className="hv5-label">
                        <span className="font-display text-[1.2rem] leading-tight tracking-[-0.02em] sm:text-[1.4rem]">{c.name}</span>
                        <span className="font-mono text-[0.75rem] tabular-nums text-faint">{d.counts[c.slug] ?? 0} parts →</span>
                      </span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Section>
      </Container>

      {/* --------------------------------------------- the print service */}
      <div className="border-y border-line bg-sheet">
        <Container>
          <div className="grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <div>
              <p className="vc-fig text-live">3D printing service</p>
              <h2 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.8rem)] leading-[1.05] tracking-[-0.03em]">
                Need a part that doesn&apos;t exist yet? We&apos;ll print it.
              </h2>
              <p className="mt-4 max-w-[44ch] text-[0.98rem] leading-relaxed text-muted">
                Custom 3D printing, quoted per job, alongside the parts to finish your build.
              </p>
              <div className="mt-7">
                <ButtonLink href={SITE.printingUrl} target="_blank" rel="noreferrer" className="group">
                  Get a print quote <span className="vc-arrow" aria-hidden>→</span>
                </ButtonLink>
              </div>
            </div>
            <HeroWorkshop className="max-w-[560px]" />
          </div>
        </Container>
      </div>

      {/* ----------------------------------------------------- the boards */}
      {d.microcontrollers.length ? (
        <Container>
          <Section divide={false}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-[clamp(1.7rem,3.4vw,2.6rem)] leading-tight tracking-[-0.03em]">Brains of the build</h2>
              <Link href="/shop/microcontrollers" className="group border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
                All microcontrollers <span className="vc-arrow" aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {d.microcontrollers.map((p, i) => (
                <Reveal key={p.slug} delay={i * 60}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </Section>
        </Container>
      ) : null}

      <Container>
        <Section>
          <Reveal>
            <Talk />
          </Reveal>
        </Section>
      </Container>
    </>
  );
}
