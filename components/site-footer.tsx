import Image from "next/image";
import Link from "next/link";
import { SOCIAL_ICONS } from "@/components/social-icons";
import { Container } from "@/components/ui";
import { getCategories } from "@/lib/catalogue";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  const categories = getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-sheet">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_1.35fr_0.9fr_1.15fr]">
          <div>
            <Image
              src="/brand/voltcraft-logo.png"
              alt={SITE.name}
              width={1600}
              height={1143}
              className="vc-logo h-20 w-auto"
            />
            <p className="mt-4 max-w-[34ch] text-[0.88rem] leading-relaxed text-muted">
              {SITE.description}
            </p>
            <ul className="mt-5 flex gap-3">
              {SITE.socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.icon];
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${social.label} — ${social.handle}`}
                      title={`${social.label} — ${social.handle}`}
                      className="grid size-10 place-items-center border border-line text-muted transition-colors hover:border-ink hover:text-live"
                    >
                      <Icon className="size-[1.15rem]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <nav aria-labelledby="footer-shop">
            <h2 id="footer-shop" className="vc-fig mb-4 font-semibold text-ink">
              Shop
            </h2>
            <ul className="grid gap-2.5 text-[0.88rem] text-muted sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop/${c.slug}`} className="hover:text-live">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="hover:text-live">
                  All products
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-help">
            <h2 id="footer-help" className="vc-fig mb-4 font-semibold text-ink">
              Buying
            </h2>
            <ul className="grid gap-2.5 text-[0.88rem] text-muted">
              <li>
                <a href={SITE.printingUrl} target="_blank" rel="noreferrer" className="hover:text-live">
                  3D printing
                </a>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-live">
                  Delivery &amp; returns
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-live">
                  About VoltCraft
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-live">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="vc-fig mb-4 font-semibold text-ink">Reach us</h2>
            <ul className="grid gap-3 text-[0.88rem]">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-start gap-2.5 text-muted transition-colors hover:text-live"
                >
                  <MailIcon />
                  <span className="min-w-0 break-words">{SITE.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={SITE.phoneHref}
                  className="flex items-center gap-2.5 text-muted transition-colors hover:text-live"
                >
                  <PhoneIcon />
                  {SITE.phone}
                </a>
              </li>
            </ul>

            <h3 className="vc-fig mb-2.5 mt-6 text-faint">Opening hours</h3>
            <dl className="grid gap-1.5 text-[0.88rem]">
              {SITE.hours.map((h) => (
                <div key={h.days} className="flex items-baseline gap-3">
                  <dt className="w-20 shrink-0 text-muted">{h.days}</dt>
                  <dd className="tabular-nums text-faint">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="vc-fig flex flex-wrap gap-x-6 gap-y-2 border-t border-line py-5 text-faint">
          <span>
            © {year} {SITE.name}
          </span>
          <span>{SITE.city}</span>
          <span className="sm:ml-auto">{SITE.tagline}</span>
        </div>
      </Container>
    </footer>
  );
}

/* --- small glyphs, matched to the 1.6 stroke used across the site --------- */
function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-[3px] shrink-0 text-faint" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-faint" aria-hidden>
      <path d="M7 3.5 9.2 8l-2 1.6a12 12 0 0 0 5.2 5.2L14 12.8 18.5 15v3.2a1.8 1.8 0 0 1-2 1.8A15.6 15.6 0 0 1 4 7.5a1.8 1.8 0 0 1 1.8-2H7z" strokeLinejoin="round" />
    </svg>
  );
}
