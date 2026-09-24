import { EnvelopeSimple, InstagramLogo, Phone, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Container } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { getCategories } from "@/lib/catalogue";
import { SITE } from "@/lib/site";

const SOCIAL = { instagram: InstagramLogo, whatsapp: WhatsappLogo } as const;

export function SiteFooter() {
  const categories = getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-line-soft bg-sheet">
      <Container>
        <div className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1.4fr_0.8fr_1.1fr] lg:gap-10">
          <div className="max-w-[36ch]">
            <Wordmark variant="logo" className="h-16 w-auto" />
            <p className="mt-5 text-[0.9rem] leading-relaxed text-muted">{SITE.description}</p>
            <ul className="mt-6 flex gap-2">
              {SITE.socials.map((social) => {
                const Icon = SOCIAL[social.icon];
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${social.label}: ${social.handle}`}
                      title={`${social.label}: ${social.handle}`}
                      className="grid size-10 place-items-center rounded-full border border-line bg-raised text-muted transition-colors hover:border-ink hover:text-ink"
                    >
                      <Icon size={19} aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <nav aria-labelledby="footer-shop">
            <h2 id="footer-shop" className="text-[0.9rem] font-semibold text-ink">
              Shop by aisle
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[0.9rem] text-muted">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop/${c.slug}`} className="transition-colors hover:text-ink">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="font-medium text-ink transition-colors hover:text-live">
                  All products
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-help">
            <h2 id="footer-help" className="text-[0.9rem] font-semibold text-ink">
              Buying
            </h2>
            <ul className="mt-4 grid gap-2.5 text-[0.9rem] text-muted">
              <li>
                <Link href="/delivery" className="transition-colors hover:text-ink">
                  Delivery &amp; returns
                </Link>
              </li>
              <li>
                <a href={SITE.printingUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink">
                  3D printing
                </a>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-ink">
                  About VoltCraft
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-ink">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.9rem] font-semibold text-ink">Reach us</h2>
            <ul className="mt-4 grid gap-3 text-[0.9rem]">
              <li>
                <a href={`mailto:${SITE.email}`} className="flex items-start gap-2.5 text-muted transition-colors hover:text-ink">
                  <EnvelopeSimple size={17} className="mt-0.5 shrink-0 text-faint" aria-hidden />
                  <span className="min-w-0 break-words">{SITE.email}</span>
                </a>
              </li>
              <li>
                <a href={SITE.phoneHref} className="flex items-center gap-2.5 text-muted transition-colors hover:text-ink">
                  <Phone size={17} className="shrink-0 text-faint" aria-hidden />
                  {SITE.phone}
                </a>
              </li>
            </ul>
            <dl className="mt-6 grid gap-1.5 text-[0.88rem]">
              {SITE.hours.map((h) => (
                <div key={h.days} className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <dt className="text-muted">{h.days}</dt>
                  <dd className="tabular-nums text-ink">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line py-6 text-[0.82rem] text-faint">
          <span>
            © {year} {SITE.name}, {SITE.city}
          </span>
          <span className="sm:ml-auto">{SITE.tagline}</span>
        </div>
      </Container>
    </footer>
  );
}
