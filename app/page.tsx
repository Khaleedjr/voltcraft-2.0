import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { ButtonLink, Container, Fig, Section } from "@/components/ui";
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
      <Container>
        <div className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <Fig>{SITE.city} · {total} lines in stock</Fig>
            <h1 className="mt-4 font-display text-[clamp(2.2rem,5.4vw,3.6rem)] leading-[1.04] tracking-[-0.028em]">
              Parts on the shelf.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-[1.65] text-muted">
              Sensors, boards, displays and the small parts that finish a build — shipped nationwide
              in 24 to 48 hours.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/shop">Shop all {total} products</ButtonLink>
              <ButtonLink href="/shop/sensors" variant="underline">
                Sensors →
              </ButtonLink>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3">
            {hero.map((p, i) => (
              <li key={p.slug}>
                <Link href={`/product/${p.slug}`} className="group block">
                  <ProductImage
                    product={p}
                    ratio="aspect-square"
                    sizes="(max-width: 1024px) 45vw, 240px"
                    priority={i < 2}
                  />
                  <p className="mt-2 truncate text-[0.8rem] text-muted group-hover:text-live">
                    {p.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* ------------------------------------------------------ value strip */}
      <div className="border-y border-line bg-sheet">
        <Container>
          <ul className="vc-fig grid gap-y-3 py-4 text-muted sm:grid-cols-3">
            <li>Same-day dispatch before 2pm</li>
            <li className="sm:text-center">
              Free delivery over {formatNaira(SITE.freeDeliveryThreshold)}
            </li>
            <li className="sm:text-right">
              <a href={SITE.quoteUrl} target="_blank" rel="noreferrer" className="hover:text-live">
                Bulk quotes →
              </a>
            </li>
          </ul>
        </Container>
      </div>

      {/* ------------------------------------------------------- categories */}
      <Container>
        <Section divide={false}>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-[1.65rem] leading-tight tracking-[-0.022em] sm:text-[2.05rem]">
              Shop by aisle
            </h2>
            <Link href="/shop" className="border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
              All products →
            </Link>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const thumb = categoryThumbnail(c.slug);
              return (
                <li key={c.slug}>
                  <Link
                    href={`/shop/${c.slug}`}
                    className="group flex items-center gap-4 border border-line bg-raised p-3 transition-colors hover:border-ink"
                  >
                    <div className="w-16 shrink-0">
                      {thumb ? (
                        <ProductImage product={thumb} ratio="aspect-square" sizes="64px" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <span className="block font-display text-[1.05rem] tracking-[-0.015em] group-hover:text-live">
                        {c.name}
                      </span>
                      <span className="vc-fig mt-1 block text-faint">
                        {countByCategory(c.slug)} products
                      </span>
                    </div>
                    <span className="ml-auto pr-1 text-muted group-hover:text-live" aria-hidden>
                      →
                    </span>
                  </Link>
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
                On offer
              </h2>
              <Link href="/shop" className="border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
                See everything →
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {onSale.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </Section>
        </Container>
      ) : null}

      {/* -------------------------------------------------------------- cta */}
      <Container>
        <Section>
          <div className="flex flex-wrap items-center justify-between gap-6 border border-line bg-sheet p-6 sm:p-8">
            <div>
              <h2 className="font-display text-[1.4rem] leading-tight tracking-[-0.02em] sm:text-[1.7rem]">
                Buying in quantity?
              </h2>
              <p className="mt-2 text-[0.92rem] text-muted">
                Send the parts list and we&apos;ll price it.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                href={SITE.quoteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center bg-live px-6 py-3.5 text-[0.9rem] font-semibold text-live-ink transition-colors hover:bg-live-hover"
              >
                Request a quote
              </a>
              <ButtonLink href="/contact" variant="outline">
                Contact us
              </ButtonLink>
            </div>
          </div>
        </Section>
      </Container>
    </>
  );
}
