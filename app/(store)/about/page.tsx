import type { Metadata } from "next";
import { ButtonLink, Container, Fig, Section } from "@/components/ui";
import { getProducts } from "@/lib/catalogue-data";
import { SITE } from "@/lib/site";

/*
 * TODO(voltcraft): this page deliberately contains no founding dates, founder
 * names or history, because none were supplied. Add the real story here.
 */

export const metadata: Metadata = {
  title: "About",
  description:
    "VoltCraft stocks engineering tools and components in Kaduna so builders in Nigeria can buy parts today instead of waiting on a shipment.",
};

const PRINCIPLES = [
  {
    fig: "01",
    title: "Stock it, don't source it",
    body: "A listing on this site means the part is on a shelf in Kaduna with a count against it. If we have to order something in, we say so and give you a date rather than let you find out after you have paid.",
  },
  {
    fig: "02",
    title: "Specifications, not adjectives",
    body: "Every product page carries the numbers you would check before committing: ranges, accuracy, voltage, tolerance, safety rating. No 'high quality', no 'professional grade'.",
  },
  {
    fig: "03",
    title: "Priced in naira, landed",
    body: "The price on the page is the price at checkout. No conversion at an invented rate, no customs surprise waiting at the other end.",
  },
  {
    fig: "04",
    title: "Built by people who build",
    body: "The catalogue is chosen by people who use the same parts on their own bench. That is why the passive kits are sorted, the cells are protected, and the flux is somewhere obvious.",
  },
];

export default async function AboutPage() {
  const lineCount = (await getProducts()).length;
  return (
    <Container>
      <div className="py-12 sm:py-16">
        <Fig>About VoltCraft</Fig>
        <h1 className="mt-4 max-w-[17ch] font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.06] tracking-[-0.022em]">
          Parts on a shelf beat parts in <em className="not-italic text-live">transit</em>.
        </h1>
        <p className="mt-6 max-w-[58ch] text-[1.05rem] leading-[1.7] text-muted">
          Building hardware in Nigeria has a specific tax on it, and it is not money — it is time.
          A part that costs a few thousand naira can cost you six weeks. VoltCraft exists to remove
          that gap: {lineCount} lines of sensors, microcontrollers, displays, actuators
          and components, held locally, priced in naira, and moving the same day you order.
        </p>
      </div>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <Fig>How we work</Fig>
            <h2 className="mt-3 max-w-[16ch] font-display text-[1.65rem] leading-[1.14] tracking-[-0.022em] sm:text-[2.05rem]">
              Four rules the catalogue follows
            </h2>
          </div>
          <ol className="border-t border-line">
            {PRINCIPLES.map((p) => (
              <li key={p.fig} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[3.5rem_1fr] sm:gap-6">
                <span className="vc-fig text-live sm:pt-1.5">{p.fig}</span>
                <div>
                  <h3 className="font-display text-[1.2rem] leading-snug tracking-[-0.015em]">
                    {p.title}
                  </h3>
                  <p className="mt-2 max-w-[58ch] text-[0.92rem] leading-relaxed text-muted">
                    {p.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section>
        <div className="border border-block-edge bg-block p-6 text-block-ink sm:p-10 lg:p-12">
          <Fig tone="block" className="text-live">
            The tagline, unpacked
          </Fig>
          <h2 className="mt-4 max-w-[24ch] font-display text-[1.55rem] leading-[1.15] tracking-[-0.02em] sm:text-[2.1rem]">
            {SITE.tagline}
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              ["Hack it", "Take the thing apart. Read the datasheet. Find out why it does that."],
              ["Build it", "Get it working on a breadboard, badly, before you get it working well."],
              ["Craft it", "Then make it something you would put your name on and hand to someone."],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-block-line pt-4">
                <h3 className="font-display text-[1.15rem] tracking-[-0.015em]">{t}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-block-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <Fig>Next step</Fig>
        <h2 className="mt-3 max-w-[20ch] font-display text-[1.65rem] leading-[1.14] tracking-[-0.022em] sm:text-[2.1rem]">
          Come and see what&apos;s on the shelf.
        </h2>
        <div className="mt-7 flex flex-wrap gap-4">
          <ButtonLink href="/shop">Browse the catalogue</ButtonLink>
          <ButtonLink href="/contact" variant="underline">
            Talk to us →
          </ButtonLink>
        </div>
      </Section>
    </Container>
  );
}
