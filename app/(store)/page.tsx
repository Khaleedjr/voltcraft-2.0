import { ArrowRight, CreditCard, MapPin, Truck, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { AddKitToCart } from "@/components/add-kit-to-cart";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { ProductRail } from "@/components/product-rail";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container } from "@/components/ui";
import { getCategories, type CategorySlug, type Product } from "@/lib/catalogue";
import { getCategoryCounts, getCategoryThumbnails, getOnSale, getProducts } from "@/lib/catalogue-data";
import { formatNaira } from "@/lib/format";
import { KITS, resolveKit } from "@/lib/kits";
import { lineKey } from "@/lib/orders";
import { SITE } from "@/lib/site";

/** The three boards and sensors in the hero: the shop's best-known parts. */
const HERO_SLUGS = ["arduino-uno-r3", "esp32-development-board-type-c-usb", "ultrasonic-sensor"];

/**
 * The aisle grid's composition, in reading order. Nine aisles fill a 4 × 4
 * grid exactly on desktop and pair up cleanly in two columns on a phone; the
 * biggest aisle gets the biggest cell.
 */
const AISLE_CELLS: { slug: CategorySlug; span: string; tone: "block" | "gold" | "plain" }[] = [
  { slug: "sensors", span: "col-span-2 md:row-span-2", tone: "block" },
  { slug: "microcontrollers", span: "col-span-2", tone: "gold" },
  { slug: "actuators", span: "", tone: "plain" },
  { slug: "power", span: "", tone: "plain" },
  { slug: "display", span: "col-span-2", tone: "plain" },
  { slug: "accessories", span: "", tone: "plain" },
  { slug: "connectors", span: "", tone: "plain" },
  { slug: "switches", span: "col-span-2", tone: "plain" },
  { slug: "fluid-control", span: "col-span-2", tone: "plain" },
];

export default async function HomePage() {
  const [products, onSale, counts, thumbs, kit] = await Promise.all([
    getProducts(),
    getOnSale(8),
    getCategoryCounts(),
    getCategoryThumbnails(),
    KITS[0] ? resolveKit(KITS[0]) : Promise.resolve(undefined),
  ]);
  const total = products.length;
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const hero = [
    ...HERO_SLUGS.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p?.images.length)),
    ...products.filter((p) => p.images.length && !HERO_SLUGS.includes(p.slug)),
  ].slice(0, 3);
  const categories = new Map(getCategories().map((c) => [c.slug, c]));

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="vc-wash-hero pointer-events-none absolute inset-0 -z-10" />
        <Container>
          <div className="grid items-center gap-10 pb-14 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:pb-20 lg:pt-16">
            <div>
              <h1 className="vc-rise max-w-[15ch] font-display text-[clamp(2.6rem,5.4vw,4.25rem)] font-semibold leading-[1] tracking-[-0.045em]">
                Everything your build needs.
              </h1>
              <p className="vc-rise mt-6 max-w-[42ch] text-[1.08rem] leading-relaxed text-muted" style={{ "--rise-delay": "90ms" } as React.CSSProperties}>
                Sensors, boards, motors and modules. Priced in naira, stocked in Kaduna, delivered anywhere in Nigeria.
              </p>
              <div className="vc-rise mt-8 flex flex-wrap items-center gap-3" style={{ "--rise-delay": "180ms" } as React.CSSProperties}>
                <ButtonLink href="/shop" className="group">
                  Shop all {total} products
                  <ArrowRight size={16} weight="bold" className="vc-arrow" aria-hidden />
                </ButtonLink>
                <ButtonLink href="#aisles" variant="outline">
                  Browse by aisle
                </ButtonLink>
              </div>
            </div>

            {hero.length === 3 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:h-[540px] lg:grid-rows-[1.25fr_1fr]">
                {hero.map((p, i) => (
                  <Link
                    key={p.slug}
                    href={`/product/${p.slug}`}
                    style={{ "--rise-delay": `${240 + i * 90}ms` } as React.CSSProperties}
                    className={`vc-rise vc-lift group flex flex-col gap-3 rounded-2xl border border-line-soft bg-raised p-3 ${
                      i === 0 ? "col-span-2" : ""
                    }`}
                  >
                    <div className={`relative ${i === 0 ? "aspect-[16/9] lg:aspect-auto lg:flex-1" : "aspect-square lg:aspect-auto lg:flex-1"}`}>
                      <ProductImage
                        product={p}
                        ratio="absolute inset-0 h-full"
                        pad={i === 0 ? "p-4" : "p-3"}
                        priority
                        sizes={i === 0 ? "(max-width: 1024px) 90vw, 600px" : "(max-width: 1024px) 45vw, 300px"}
                      />
                    </div>
                    <div className={`flex gap-x-3 gap-y-0.5 px-1.5 pb-0.5 ${i === 0 ? "items-baseline justify-between" : "flex-col sm:flex-row sm:items-baseline sm:justify-between"}`}>
                      <span className={`min-w-0 truncate font-medium ${i === 0 ? "text-[1rem]" : "text-[0.88rem]"}`}>{p.name}</span>
                      <span className="shrink-0 font-display text-[0.98rem] font-semibold tabular-nums">{formatNaira(p.price)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------ plain facts */}
      <div className="border-y border-line-soft bg-raised/60">
        <Container>
          <ul className="grid gap-4 py-5 text-[0.92rem] text-muted sm:grid-cols-3 sm:gap-6">
            <li className="flex items-center gap-3">
              <Truck size={22} className="shrink-0 text-live" aria-hidden />
              Free delivery on orders over {formatNaira(SITE.freeDeliveryThreshold)}
            </li>
            <li className="flex items-center gap-3">
              <MapPin size={22} className="shrink-0 text-live" aria-hidden />
              Stocked in Kaduna, delivered across Nigeria
            </li>
            <li className="flex items-center gap-3">
              <CreditCard size={22} className="shrink-0 text-live" aria-hidden />
              Pay by card, bank transfer or USSD
            </li>
          </ul>
        </Container>
      </div>

      {/* ------------------------------------------------------------ aisles */}
      <section id="aisles" className="scroll-mt-24 py-16 lg:py-24">
        <Container>
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
            Shop by aisle
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:auto-rows-[200px] md:grid-cols-4">
            {AISLE_CELLS.map(({ slug, span, tone }, i) => {
              const category = categories.get(slug);
              if (!category) return null;
              const thumb = thumbs[slug];
              const big = slug === "sensors";
              const surface =
                tone === "block"
                  ? "bg-block text-block-ink"
                  : tone === "gold"
                    ? "bg-gold/25 text-ink hover:bg-gold/35"
                    : "border border-line-soft bg-raised text-ink hover:border-line";
              return (
                <li key={slug} className={`${span} ${big ? "min-h-[260px] md:min-h-0" : "min-h-[160px] md:min-h-0"}`}>
                  <Reveal delay={(i % 4) * 60} className="h-full">
                    <Link
                      href={`/shop/${slug}`}
                      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-5 transition-[background-color,border-color,transform] duration-300 active:scale-[0.99] ${surface}`}
                    >
                      {tone === "block" ? <span aria-hidden className="vc-wash-block pointer-events-none absolute inset-0" /> : null}
                      <div className="relative z-10">
                        <span className={`block font-display font-semibold tracking-[-0.03em] ${big ? "text-[clamp(1.6rem,2.6vw,2.2rem)]" : "text-[1.2rem]"}`}>
                          {category.name}
                        </span>
                        <span className={`mt-1 block text-[0.85rem] ${tone === "block" ? "text-block-muted" : "text-muted"}`}>
                          {counts[slug]} products
                        </span>
                        {big ? <span className="mt-4 hidden max-w-[30ch] text-[0.92rem] leading-relaxed text-block-muted md:block">{category.note}</span> : null}
                      </div>
                      <div className="relative z-10 flex items-end justify-between gap-3">
                        <span
                          className={`grid size-9 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-1 ${
                            tone === "block" ? "bg-gold text-live-ink" : "bg-ink text-ground"
                          }`}
                          aria-hidden
                        >
                          <ArrowRight size={16} weight="bold" />
                        </span>
                      </div>
                      {thumb?.images[0] ? (
                        <div
                          className={`absolute overflow-hidden rounded-xl bg-white transition-transform duration-500 group-hover:scale-[1.04] ${
                            big ? "bottom-5 right-5 size-[46%] max-h-[260px] max-w-[260px]" : "bottom-4 right-4 size-[42%] max-h-[120px] max-w-[120px]"
                          }`}
                        >
                          <Image src={thumb.images[0]} alt="" fill sizes={big ? "260px" : "120px"} className="object-contain p-3" />
                        </div>
                      ) : null}
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* --------------------------------------------------------------- kit */}
      {kit && kit.items.length >= 3 ? (
        <section className="pb-16 lg:pb-24">
          <Container>
            <Reveal>
              <div className="grid grid-cols-1 gap-10 rounded-[28px] border border-line-soft bg-raised p-5 sm:p-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-12 lg:p-12">
                <div className="flex flex-col">
                  <h2 className="font-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
                    A sensor node, kitted in one order.
                  </h2>
                  <p className="mt-4 max-w-[46ch] text-[1rem] leading-relaxed text-muted">
                    A Wi-Fi board, sensors, a screen and a rechargeable cell. It reads the soil and the air, sleeps between readings and reports over Wi-Fi.
                  </p>
                  <div className="mt-8 lg:mt-auto">
                    <p className="text-[0.9rem] text-muted">
                      {kit.items.length} parts, together
                    </p>
                    <p className="mt-1 font-display text-[2.4rem] font-semibold leading-none tracking-[-0.04em]">{formatNaira(kit.total)}</p>
                    <div className="mt-6">
                      <AddKitToCart lines={kit.items.map((i) => ({ slug: i.product.slug, variant: i.variant, qty: i.qty }))} />
                    </div>
                  </div>
                </div>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {kit.items.map((item) => (
                    <li key={lineKey({ slug: item.product.slug, variant: item.variant })} className="min-w-0">
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="group flex h-full items-center gap-3 rounded-2xl border border-line-soft bg-ground/60 p-2.5 pr-4 transition-colors hover:border-line"
                      >
                        <div className="relative size-16 shrink-0">
                          <ProductImage product={item.product} ratio="absolute inset-0 h-full" pad="p-1.5" sizes="64px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[0.88rem] font-medium leading-snug group-hover:text-live">{item.product.name}</p>
                          <p className="truncate text-[0.8rem] text-faint">{item.variant ? `${item.variant}: ${item.why}` : item.why}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-display text-[0.92rem] font-semibold tabular-nums">{formatNaira(item.lineTotal)}</p>
                          {item.qty > 1 ? <p className="text-[0.75rem] text-faint tabular-nums">{item.qty} × {formatNaira(item.lineTotal / item.qty)}</p> : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </Container>
        </section>
      ) : null}

      {/* ----------------------------------------------------------- on sale */}
      {onSale.length ? (
        <section className="pb-16 lg:pb-24">
          <Container>
            <ProductRail
              label="Products on sale"
              heading={
                <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
                  On sale
                </h2>
              }
            >
                {onSale.map((p) => (
                  <div key={p.slug} className="w-[72vw] shrink-0 sm:w-[260px] lg:w-[calc((100%-48px)/4)]">
                    <ProductCard product={p} />
                  </div>
                ))}
            </ProductRail>
          </Container>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- services */}
      <section className="pb-8">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Reveal className="h-full">
              <div className="relative flex h-full flex-col justify-between gap-10 overflow-hidden rounded-[28px] bg-block p-8 text-block-ink sm:p-10">
                <div aria-hidden className="vc-wash-block pointer-events-none absolute inset-0" />
                <div className="relative">
                  <h2 className="max-w-[16ch] font-display text-[clamp(1.8rem,3.2vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
                    Buying for a class, a lab or a team?
                  </h2>
                  <p className="mt-4 max-w-[44ch] text-[1rem] leading-relaxed text-block-muted">
                    Send the parts list on WhatsApp and we&apos;ll price the lot, usually the same day.
                  </p>
                </div>
                <div className="relative">
                  <a
                    href={SITE.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gold px-6 py-3.5 text-[0.9rem] font-semibold text-live-ink transition-[background-color,transform] duration-200 hover:bg-gold-hover active:scale-[0.98]"
                  >
                    <WhatsappLogo size={18} weight="fill" aria-hidden /> Message us on WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={80} className="h-full">
              <div className="flex h-full flex-col justify-between gap-10 rounded-[28px] border border-line-soft bg-raised p-8 sm:p-10">
                <div>
                  <h2 className="max-w-[16ch] font-display text-[clamp(1.6rem,2.6vw,2.1rem)] font-semibold leading-[1.08] tracking-[-0.04em]">
                    Need a part nobody sells?
                  </h2>
                  <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-muted">
                    We 3D print custom parts for your project, quoted per job.
                  </p>
                </div>
                <div>
                  <ButtonLink href={SITE.printingUrl} target="_blank" rel="noreferrer" variant="outline" className="group">
                    Get a print quote
                    <ArrowRight size={16} weight="bold" className="vc-arrow" aria-hidden />
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
