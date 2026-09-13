import Link from "next/link";
import { AddKitToCart } from "@/components/add-kit-to-cart";
import { ProductCard } from "@/components/product-card";
import {
  ButtonLink,
  Container,
  DimensionRule,
  Fig,
  Section,
  SectionHeading,
} from "@/components/ui";
import { getCategories, getFeaturedProducts, getProducts, countByCategory } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";
import { getKit } from "@/lib/kits";
import { SITE } from "@/lib/site";

const AUDIENCES = [
  {
    name: "Makers and hobbyists",
    detail:
      "Boards, sensors and the passives you run out of at midnight. Order before 2pm and it moves the same day.",
  },
  {
    name: "Students and project groups",
    detail:
      "Final-year builds, robotics teams and lab work — kitted from one order so nobody waits on a missing part.",
  },
  {
    name: "Hardware startups",
    detail:
      "Prototype quantities now, larger runs on quote. Same parts, same bench, no minimum order to get started.",
  },
  {
    name: "Repair and service benches",
    detail:
      "Rework stations, hot air, ESD kit and the meters that tell you the truth before you order a replacement.",
  },
];

export default function HomePage() {
  const categories = getCategories();
  const featured = getFeaturedProducts(4);
  const totalLines = getProducts().length;
  const kit = getKit("soil-monitor-node");

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <Container>
        <div className="py-14 sm:py-20 lg:py-24">
          <div className="grid items-end gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
            <div>
              <Fig>Fig. 1 — Kaduna bench stock, {totalLines} lines</Fig>
              <h1 className="mt-4 max-w-[15ch] font-display text-[clamp(2.15rem,5.4vw,4rem)] leading-[1.04] tracking-[-0.022em]">
                Your next build shouldn&apos;t wait on <em className="not-italic text-live">customs</em>.
              </h1>
            </div>
            <div>
              <p className="max-w-[46ch] text-[1.02rem] leading-[1.68] text-muted">
                Sensors, microcontrollers, displays, actuators and the small parts that hold a build
                together — held in Kaduna, shipped nationwide in 24 to 48 hours. Order today, solder
                this weekend.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <ButtonLink href="/shop">Browse the catalogue</ButtonLink>
                <ButtonLink href="/shop/sensors" variant="underline">
                  Sensors →
                </ButtonLink>
              </div>
            </div>
          </div>

          <div className="mt-12 sm:mt-16">
            <DimensionRule>{SITE.tagline}</DimensionRule>
          </div>

          <dl className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: String(totalLines), t: "Lines held in Kaduna, not ordered in when you ask" },
              { n: "24–48h", t: "Door delivery to Abuja, Kano, Zaria and Jos" },
              { n: formatNaira(SITE.freeDeliveryThreshold), t: "Order value above which delivery is on us" },
              { n: String(categories.length), t: "Aisles, from passives to the bench you solder on" },
            ].map((m) => (
              <div key={m.t} className="border-t-2 border-ink pt-3.5">
                <dt className="sr-only">{m.t}</dt>
                <dd>
                  <span className="block font-display text-[1.95rem] leading-none tracking-[-0.025em] tabular-nums">
                    {m.n}
                  </span>
                  <span className="mt-2.5 block text-[0.85rem] leading-relaxed text-muted">{m.t}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>

      {/* ---------------------------------------------------- the aisles */}
      <Container>
        <Section>
          <SectionHeading
            fig="Section 01"
            title="Nine aisles, stocked for people who finish things"
            lede="Sorted the way a build goes: brain, senses, power, and the bench you put it together on."
            action={
              <Link href="/shop" className="border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
                All {totalLines} products →
              </Link>
            }
          />
          <ul className="mt-9 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => (
              <li key={c.slug} className="bg-sheet">
                <Link
                  href={`/shop/${c.slug}`}
                  className="group flex h-full flex-col gap-2 p-5 transition-colors hover:bg-raised"
                >
                  <span className="vc-fig text-live">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[1.12rem] leading-snug tracking-[-0.015em] group-hover:text-live">
                    {c.name}
                  </span>
                  <span className="text-[0.84rem] leading-relaxed text-muted">{c.blurb}</span>
                  <span className="vc-fig mt-auto pt-3 text-faint">
                    {countByCategory(c.slug)} products
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </Container>

      {/* ------------------------------------------------ featured stock */}
      <Container>
        <Section>
          <SectionHeading
            fig="Section 02"
            title="Moving off the shelf this week"
            lede="Priced in naira, counted in Kaduna, and honest about how many are actually left."
            action={
              <Link href="/shop" className="border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
                Shop everything →
              </Link>
            }
          />
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Section>
      </Container>

      {/* -------------------------------------------------- who we stock for */}
      <Container>
        <Section>
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <Fig>Section 03</Fig>
              <h2 className="mt-3 max-w-[18ch] font-display text-[1.65rem] leading-[1.14] tracking-[-0.022em] sm:text-[2.05rem]">
                Who we keep stock for
              </h2>
              <p className="mt-4 max-w-[42ch] text-[0.95rem] leading-relaxed text-muted">
                Four kinds of bench, four different shopping lists. We hold the lines each of them
                runs out of first.
              </p>
            </div>
            <ol className="border-t border-line">
              {AUDIENCES.map((a, i) => (
                <li
                  key={a.name}
                  className="grid gap-2 border-b border-line py-6 sm:grid-cols-[3.5rem_1fr_1.15fr] sm:gap-6"
                >
                  <span className="vc-fig text-live sm:pt-1.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-[1.18rem] leading-snug tracking-[-0.015em]">
                    {a.name}
                  </h3>
                  <p className="text-[0.9rem] leading-relaxed text-muted">{a.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      </Container>

      {/* -------------------------------------------------------- the kit */}
      {kit ? (
        <Container>
          <Section>
            <div className="grid gap-8 border border-block-edge bg-block p-6 text-block-ink sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:gap-14 lg:p-12">
              <div>
                <Fig tone="block" className="text-live">
                  {kit.figure} — Bill of materials
                </Fig>
                <h2 className="mt-3.5 max-w-[20ch] font-display text-[1.55rem] leading-[1.15] tracking-[-0.02em] sm:text-[2.05rem]">
                  {kit.name}
                </h2>
                <p className="mt-4 max-w-[44ch] text-[0.95rem] leading-[1.68] text-block-muted">
                  {kit.blurb}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <AddKitToCart lines={kit.lines} />
                  <span className="font-display text-[1.35rem] tabular-nums">
                    {formatNaira(kit.total)}
                  </span>
                </div>
              </div>
              <ul className="self-start">
                {kit.items.map((item) => (
                  <li
                    key={item.product.slug}
                    className="flex items-baseline justify-between gap-4 border-b border-block-line py-3 first:border-t"
                  >
                    <Link href={`/product/${item.product.slug}`} className="text-[0.9rem] hover:text-live">
                      {item.product.name}
                      <span className="block text-[0.78rem] text-block-muted">{item.why}</span>
                    </Link>
                    <span className="shrink-0 font-mono text-[0.8rem] tabular-nums text-block-muted">
                      ×{item.qty} · {formatNaira(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </Container>
      ) : null}

      {/* ------------------------------------------------------------ cta */}
      <Container>
        <Section>
          <Fig>Next step</Fig>
          <h2 className="mt-3 max-w-[22ch] font-display text-[1.65rem] leading-[1.14] tracking-[-0.022em] sm:text-[2.2rem]">
            Buying for a lab, a class or a production run?
          </h2>
          <p className="mt-4 max-w-[52ch] text-[0.98rem] leading-relaxed text-muted">
            Send the parts list and we&apos;ll come back with a priced, in-stock schedule. Anything
            we don&apos;t hold, we&apos;ll tell you how long it takes rather than let you find out.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <a
              href={SITE.quoteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-live px-6 py-3.5 text-[0.9rem] font-semibold text-live-ink transition-colors hover:bg-live-hover"
            >
              Request a bulk quote
            </a>
            <ButtonLink href="/contact" variant="underline">
              Talk to the bench →
            </ButtonLink>
          </div>
        </Section>
      </Container>
    </>
  );
}
