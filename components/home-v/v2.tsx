import Link from "next/link";
import { HeroWorkshop } from "@/components/hero-workshop";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container, Section } from "@/components/ui";
import type { Category, Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";
import type { HomeData } from "@/lib/home-data";
import { SITE } from "@/lib/site";
import { CountUp } from "./count-up";
import { LEDE, Talk } from "./parts";
import { Spotlight } from "./spotlight";
import { FREE_ELSEWHERE, FREE_IN_KADUNA, LOWEST_DELIVERY_FEE } from "@/lib/delivery";

/**
 * Version 2, centre stage. The headline set large and centred, the workshop
 * under it on a lit stage with real parts floating round it; the aisles run
 * past in two rows going opposite ways; the sale is a spotlight that moves on
 * by itself; three steps say how an order works.
 */
export function HomeV2({ d }: { d: HomeData }) {
  const floats = d.spread.slice(0, 4);
  const half = Math.ceil(d.categories.length / 2);
  return (
    <>
      <div className="relative overflow-hidden">
        <div aria-hidden className="hv2-light pointer-events-none absolute inset-0 -z-10" />
        <Container>
          <div className="pt-12 text-center sm:pt-16">
            <p className="vc-fig inline-flex items-center gap-2 border border-line bg-raised px-3 py-1.5 text-muted">
              <span className="size-1.5 bg-gold" aria-hidden /> Electronics · Robotics · 3D printing
            </p>
            <h1 className="hv2-title mx-auto mt-6 max-w-[15ch] font-display text-[clamp(2.7rem,7.4vw,5.8rem)] leading-[0.96] tracking-[-0.045em]">
              Everything your build needs.
            </h1>
            <p className="mx-auto mt-6 max-w-[44ch] text-[1.02rem] leading-relaxed text-muted">{LEDE}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink href="/shop" className="group">
                Shop all products <span className="vc-arrow" aria-hidden>→</span>
              </ButtonLink>
              <ButtonLink href={SITE.printingUrl} target="_blank" rel="noreferrer" variant="outline" className="group">
                3D Printing <span className="vc-arrow" aria-hidden>→</span>
              </ButtonLink>
            </div>
          </div>

          <div className="hv2-stage relative mx-auto mt-8 max-w-[980px]">
            {floats.map((p, i) => (
              <Link key={p.slug} href={`/product/${p.slug}`} className={`hv2-float hv2-float-${i} group`} aria-label={p.name}>
                <ProductImage product={p} ratio="aspect-square" sizes="120px" pad="p-2.5" />
                <span className="hv2-float-tag font-mono text-[0.7rem] tabular-nums">{formatNaira(p.price)}</span>
              </Link>
            ))}
            <HeroWorkshop className="max-w-[640px]" />
          </div>
        </Container>
        <div className="border-y border-line bg-sheet">
          <Container>
            <dl className="grid grid-cols-3 divide-x divide-line text-center">
              <div className="py-5">
                <dd className="font-display text-[clamp(1.5rem,3vw,2.2rem)] leading-none">
                  <CountUp to={d.inStock} />
                </dd>
                <dt className="vc-fig mt-2 text-faint">Parts in stock</dt>
              </div>
              <div className="py-5">
                <dd className="font-display text-[clamp(1.5rem,3vw,2.2rem)] leading-none">
                  <CountUp to={d.categories.length} />
                </dd>
                <dt className="vc-fig mt-2 text-faint">Categories</dt>
              </div>
              <div className="py-5">
                <dd className="font-display text-[clamp(1.5rem,3vw,2.2rem)] leading-none">
                  ₦<CountUp to={FREE_IN_KADUNA / 1000} />k
                </dd>
                <dt className="vc-fig mt-2 text-faint">Free delivery in Kaduna over</dt>
              </div>
            </dl>
          </Container>
        </div>
      </div>

      {/* ------------------------------------------- the aisles, running past */}
      <Section divide={false} className="overflow-hidden">
        <Container>
          <div className="mb-10 text-center">
            <p className="vc-fig text-live">Shop by category</p>
            <h2 className="mt-3 font-display text-[clamp(1.8rem,4vw,3rem)] leading-tight tracking-[-0.03em]">
              {d.categories.length} categories. One order.
            </h2>
          </div>
        </Container>
        <AisleRow categories={d.categories.slice(0, half)} counts={d.counts} thumbs={d.thumbs} />
        <AisleRow categories={d.categories.slice(half)} counts={d.counts} thumbs={d.thumbs} reverse />
      </Section>

      {/* ------------------------------------------------ the sale, spotlit */}
      {d.sale.length ? (
        <div className="border-y border-line bg-sheet">
          <Container>
            <Section divide={false}>
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-tight tracking-[-0.03em]">On sale now</h2>
                <Link href="/shop" className="group border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
                  See everything <span className="vc-arrow" aria-hidden>→</span>
                </Link>
              </div>
              <Spotlight products={d.sale} />
            </Section>
          </Container>
        </div>
      ) : null}

      {/* --------------------------------------------------- how it works */}
      <Container>
        <Section divide={false}>
          <p className="vc-fig text-center text-live">How an order works</p>
          <Reveal>
            <ol className="hv2-steps relative mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              <span className="hv2-line" aria-hidden />
              <Step n="01" title="Find the part" text={`Search all ${d.total} parts by name, value or spec: 4.7k, 16GB, 1N4007.`} />
              <Step n="02" title="Pay at checkout" text="Pay securely at checkout with Paystack." />
              <Step
                n="03"
                title="Delivered"
                text={`Anywhere in Nigeria, from ${formatNaira(LOWEST_DELIVERY_FEE)}. Free from ${formatNaira(FREE_IN_KADUNA)} in Kaduna and ${formatNaira(FREE_ELSEWHERE)} elsewhere.`}
              />
            </ol>
          </Reveal>
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

function AisleRow({
  categories,
  counts,
  thumbs,
  reverse = false,
}: {
  categories: Category[];
  counts: HomeData["counts"];
  thumbs: Partial<Record<string, Product>>;
  reverse?: boolean;
}) {
  const run = (copy: number) => (
    <ul className="hv2-run" aria-hidden={copy > 0 ? true : undefined}>
      {categories.map((c) => {
        const t = thumbs[c.slug];
        return (
          <li key={`${copy}-${c.slug}`}>
            <Link href={`/shop/${c.slug}`} tabIndex={copy > 0 ? -1 : undefined} className="hv2-chip group">
              {t ? (
                <span className="w-16 shrink-0">
                  <ProductImage product={t} ratio="aspect-square" sizes="64px" pad="p-1.5" />
                </span>
              ) : null}
              <span className="font-display text-[clamp(1.3rem,2.4vw,1.9rem)] leading-none tracking-[-0.025em] group-hover:text-live">{c.name}</span>
              <span className="font-mono text-[0.8rem] tabular-nums text-faint">{counts[c.slug] ?? 0}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
  return (
    <div className={`hv2-marquee ${reverse ? "is-reverse" : ""}`}>
      <div className="hv2-track">
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <li className="relative text-center">
      <span className="relative z-10 mx-auto grid size-14 place-items-center border border-ink bg-gold font-mono text-[0.95rem] font-semibold text-live-ink">
        {n}
      </span>
      <h3 className="mt-5 font-display text-[1.35rem] tracking-[-0.02em]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[30ch] text-[0.92rem] leading-relaxed text-muted">{text}</p>
    </li>
  );
}
