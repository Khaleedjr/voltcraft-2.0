import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Container, Fig, Section } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the VoltCraft counter — email, phone, WhatsApp and opening hours, or send a message about stock, bulk pricing or an order.",
};

export default function ContactPage() {
  return (
    <Container>
      <div className="py-12 sm:py-16">
        <Fig>Contact</Fig>
        <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2rem,5vw,3.4rem)] leading-[1.06] tracking-[-0.022em]">
          Ask before you order. It&apos;s faster.
        </h1>
        <p className="mt-6 max-w-[54ch] text-[1.02rem] leading-[1.7] text-muted">
          Not sure whether a board fits the build, or whether we can get twenty of something by
          Friday? Say so and we&apos;ll answer straight.
        </p>
      </div>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <Fig>Direct lines</Fig>
            <dl className="mt-5 border-t border-line">
              {[
                { t: "Email", v: SITE.email, href: `mailto:${SITE.email}` },
                { t: "Phone", v: SITE.phone, href: SITE.phoneHref },
                { t: "WhatsApp", v: SITE.phone, href: SITE.whatsapp },
                { t: "3D printing", v: "quote.voltcraft.org.ng", href: SITE.printingUrl },
              ].map((row) => (
                <div key={row.t} className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line py-3.5">
                  <dt className="vc-fig text-muted">{row.t}</dt>
                  <dd>
                    <a
                      href={row.href}
                      className="text-[0.95rem] font-semibold hover:text-live"
                      {...(row.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {row.v}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>

            <h2 className="vc-fig mt-9 text-muted">Counter hours</h2>
            <dl className="mt-4 border-t border-line">
              {SITE.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4 border-b border-line py-3 text-[0.92rem]">
                  <dt>{h.days}</dt>
                  <dd className="tabular-nums text-muted">{h.time}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-[0.88rem] leading-relaxed text-muted">{SITE.city}</p>
          </div>

          <div>
            <Fig>Send a message</Fig>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>
        </div>
      </Section>
    </Container>
  );
}
