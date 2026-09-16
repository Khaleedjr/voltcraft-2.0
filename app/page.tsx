import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { HeroShowcase } from "@/components/hero-showcase";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container, Section } from "@/components/ui";
import {
  categoryThumbnail,
  countByCategory,
  getCategories,
  getFeaturedProducts,
  getOnSale,
  getProduct,
  getProducts,
  type Product,
} from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";
import { SITE } from "@/lib/site";

/** Four recognisable things, for the hero. Falls back if the slugs move. */
function heroProducts(): Product[] {
  const wanted = ["arduino-uno-r3", "esp32-development-board-type-c-usb", "oled-screen-display-module", "180-micro-servo-motor"];
  const picked = wanted.map(getProduct).filter((p): p is Product => Boolean(p?.images.length));
  if (picked.length === 4) return picked;
  const pool = getFeaturedProducts(8).concat(getProducts().filter((p) => p.images.length));
  const seen = new Set(picked.map((p) => p.slug));
  for (const p of pool) {
    if (picked.length === 4) break;
    if (!seen.has(p.slug)) { picked.push(p); seen.add(p.slug); }
  }
  return picked.slice(0, 4);
}

export default function HomePage() {
  const categories = getCategories();
  const total = getProducts().length;
  const onSale = getOnSale(8);
  const hero = heroProducts();

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <div className="relative overflow-hidden">
        {/* a soft blueprint wash behind the hero, fading down into the page */}
        <div
          aria-hidden
          className="vc-wash-hero pointer-events-none absolute inset-0 -z-10 opacity-70"
        />
        <Container>
          <div className="grid items-center gap-10 py-14 sm:py-18 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
            <div>
              <h1 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.1] tracking-[-0.025em]">
                Everything your build needs.
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink href="/shop" className="group">
                  Shop all {total} products
                  <span className="vc-arrow ml-1" aria-hidden>→</span>
                </ButtonLink>
                <ButtonLink href="/shop/sensors" variant="underline" className="group">
                  Sensors <span className="vc-arrow" aria-hidden>→</span>
                </ButtonLink>
              </div>
            </div>

            <div className="pt-2 sm:pt-6 lg:pt-0">
              <HeroShowcase products={hero} />
            </div>
          </div>
        </Container>
      </div>

      {/* ------------------------------------------------------ value strip */}
      <div className="border-y border-line bg-sheet">
        <Container>
          <ul className="vc-fig grid gap-y-3 py-4 text-muted sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <Bolt /> Same-day dispatch before 2pm
            </li>
            <li className="flex items-center gap-2 sm:justify-center">
              <Truck /> Free delivery over {formatNaira(SITE.freeDeliveryThreshold)}
            </li>
            <li className="sm:text-right">
              <a
                href={SITE.printingUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 hover:text-live sm:justify-end"
              >
                <Cube /> 3D printing service <span className="vc-arrow" aria-hidden>→</span>
              </a>
            </li>
          </ul>
        </Container>
      </div>

      {/* ------------------------------------------------------- categories */}
      <Container>
        <Section divide={false}>
          <div className="flex flex-wrap items-baseline justify-end gap-4">
            <Link href="/shop" className="group border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
              All products <span className="vc-arrow" aria-hidden>→</span>
            </Link>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => {
              const thumb = categoryThumbnail(c.slug);
              return (
                <li key={c.slug}>
                  <Reveal delay={(i % 3) * 70}>
                    <Link
                      href={`/shop/${c.slug}`}
                      className="vc-lift group flex items-center gap-4 border border-line bg-raised p-3"
                    >
                      <div className="w-16 shrink-0">
                        {thumb ? (
                          <ProductImage product={thumb} ratio="aspect-square" sizes="64px" pad="p-2" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-display text-[1.05rem] tracking-[-0.015em] transition-colors group-hover:text-live">
                          {c.name}
                        </span>
                        <span className="vc-fig mt-1 block text-faint">
                          {countByCategory(c.slug)} products
                        </span>
                      </div>
                      <span className="vc-arrow ml-auto pr-1 text-muted group-hover:text-live" aria-hidden>
                        →
                      </span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Section>
      </Container>

      {/* ---------------------------------------------------------- on sale */}
      {onSale.length ? (
        <Container>
          <Section>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-display text-[1.65rem] leading-tight tracking-[-0.022em] sm:text-[2.05rem]">
                Sale items
              </h2>
              <Link href="/shop" className="group border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
                See everything <span className="vc-arrow" aria-hidden>→</span>
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {onSale.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 4) * 60}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </Section>
        </Container>
      ) : null}

      {/* -------------------------------------------------------------- cta */}
      <Container>
        <Section>
          <Reveal>
            <div className="relative overflow-hidden rounded-lg border border-line bg-block p-6 text-block-ink sm:p-9">
              <div
                aria-hidden
                className="vc-wash-block pointer-events-none absolute inset-0 opacity-60"
              />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div>
                  <h2 className="font-display text-[1.5rem] leading-tight tracking-[-0.02em] sm:text-[1.9rem]">
                    Buying in quantity?
                  </h2>
                  <p className="mt-2 max-w-[44ch] text-[0.95rem] text-block-muted">
                    Send the parts list and we&apos;ll price it — usually the same day.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <a
                    href={SITE.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-sm bg-live px-6 py-3.5 text-[0.9rem] font-semibold text-live-ink transition-colors hover:bg-live-hover"
                  >
                    Message us on WhatsApp
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-sm border border-block-line px-6 py-3.5 text-[0.9rem] font-semibold text-block-ink transition-colors hover:border-block-ink"
                  >
                    Contact us
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </Section>
      </Container>
    </>
  );
}

/* --- small inline glyphs for the value strip ----------------------------- */
function Bolt() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-live" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}
function Truck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-live" aria-hidden>
      <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}
function Cube() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-live" aria-hidden>
      <path d="M12 2 21 7v10l-9 5-9-5V7z" /><path d="M12 12 21 7M12 12v10M12 12 3 7" />
    </svg>
  );
}
