import Link from "next/link";
import { HeroWorkshop } from "@/components/hero-workshop";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import type { HomeData } from "@/lib/home-data";
import { SITE } from "@/lib/site";
import { KitPanel, LEDE, off, Talk } from "./parts";
import { ScrollSpy } from "./scroll-spy";

const SECTIONS = [
  { id: "aisles", label: "Shop by category" },
  { id: "sale", label: "On sale now" },
  { id: "kit", label: "A kit in one order" },
  { id: "talk", label: "Buying in quantity" },
];

/**
 * Version 3, the split screen. On a wide screen the left half holds still:
 * the headline, the workshop and a contents list that follows along, while
 * the right half scrolls through the shop. Each aisle is a fan of three of
 * its parts that spreads when pointed at. On a phone the halves stack.
 */
export function HomeV3({ d }: { d: HomeData }) {
  return (
    <Container>
      <div className="lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <aside className="hv3-pin flex flex-col justify-center gap-7 py-10 sm:py-14 lg:sticky lg:top-[73px] lg:h-[calc(100svh-73px)] lg:py-8">
          <div>
            <p className="vc-fig text-live">VoltCraft · Electronics for makers</p>
            <h1 className="mt-4 font-display text-[clamp(2.3rem,4.4vw,3.7rem)] leading-[1.0] tracking-[-0.038em]">Everything your build needs.</h1>
            <p className="mt-4 max-w-[40ch] text-[0.98rem] leading-relaxed text-muted">{LEDE}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <ButtonLink href="/shop" className="group">
                Shop all products <span className="vc-arrow" aria-hidden>→</span>
              </ButtonLink>
              <ButtonLink href={SITE.printingUrl} target="_blank" rel="noreferrer" variant="underline" className="group">
                3D Printing <span className="vc-arrow" aria-hidden>→</span>
              </ButtonLink>
            </div>
          </div>
          <HeroWorkshop className="max-w-[min(440px,42svh)] lg:mx-0" />
          <div className="hidden lg:block">
            <ScrollSpy items={SECTIONS} />
          </div>
        </aside>

        <div className="lg:border-l lg:border-line lg:pl-14">
          {/* -------------------------------------------- aisles, as fans */}
          <section id="aisles" className="scroll-mt-24 border-t border-line py-12 lg:border-t-0 lg:py-16">
            <Head n="01" title="Shop by category" href="/shop" action="All products" />
            <ul className="mt-8">
              {d.categories.map((c, i) => {
                const shots = (d.shots[c.slug] ?? []).slice(0, 3);
                return (
                  <li key={c.slug} className="border-b border-line first:border-t">
                    <Reveal delay={i * 30}>
                      <Link href={`/shop/${c.slug}`} className="hv3-aisle group">
                        <span className="hv3-fan" aria-hidden>
                          {shots.map((p, k) => (
                            <span key={p.slug} className={`hv3-card hv3-card-${k}`}>
                              <ProductImage product={p} ratio="aspect-square" sizes="96px" pad="p-2" />
                            </span>
                          ))}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-baseline gap-3">
                            <span className="font-display text-[1.45rem] leading-tight tracking-[-0.02em] group-hover:text-live">{c.name}</span>
                            <span className="font-mono text-[0.78rem] tabular-nums text-faint">{d.counts[c.slug] ?? 0}</span>
                          </span>
                          <span className="mt-1 block text-[0.88rem] leading-snug text-muted">{c.blurb}</span>
                        </span>
                        <span className="vc-arrow text-[1.1rem]" aria-hidden>
                          →
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ------------------------------------------- the sale, as rows */}
          {d.sale.length ? (
            <section id="sale" className="scroll-mt-24 border-t border-line py-12 lg:py-16">
              <Head n="02" title="On sale now" href="/shop" action="See everything" />
              <ul className="mt-8 grid gap-4">
                {d.sale.map((p, i) => (
                  <li key={p.slug}>
                    <Reveal delay={i * 60}>
                      <Link href={`/product/${p.slug}`} className="hv3-deal group">
                        <span className="w-24 shrink-0 sm:w-32">
                          <ProductImage product={p} ratio="aspect-square" sizes="128px" pad="p-2.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-[1.15rem] leading-snug tracking-[-0.015em] group-hover:text-live sm:text-[1.3rem]">
                            {p.name}
                          </span>
                          <span className="mt-2 flex flex-wrap items-baseline gap-2">
                            <span className="font-display text-[1.4rem] tabular-nums">{formatNaira(p.price)}</span>
                            {p.compareAt ? <span className="text-[0.85rem] text-faint line-through tabular-nums">{formatNaira(p.compareAt)}</span> : null}
                          </span>
                          {/* how much it is off, as a bar that fills in */}
                          <span className="mt-3 flex items-center gap-3">
                            <span className="hv3-bar" style={{ ["--off" as string]: `${Math.min(100, off(p) * 2.5)}%` }} aria-hidden />
                            <span className="vc-fig text-live">−{off(p)}%</span>
                          </span>
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section id="kit" className="scroll-mt-24 border-t border-line py-12 lg:py-16">
            <KitPanel kit={d.kit} stacked />
          </section>

          <section id="talk" className="scroll-mt-24 border-t border-line py-12 lg:py-16">
            <Reveal>
              <Talk />
            </Reveal>
          </section>
        </div>
      </div>
    </Container>
  );
}

function Head({ n, title, href, action }: { n: string; title: string; href: string; action: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h2 className="flex items-baseline gap-3 font-display text-[clamp(1.6rem,3vw,2.3rem)] leading-tight tracking-[-0.025em]">
        <span className="vc-fig text-live">{n}</span>
        {title}
      </h2>
      <Link href={href} className="group border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
        {action} <span className="vc-arrow" aria-hidden>→</span>
      </Link>
    </div>
  );
}
