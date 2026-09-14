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
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr]">
          <div>
            <Image
              src="/brand/voltcraft-logo.png"
              alt={SITE.name}
              width={1600}
              height={1143}
              className="h-20 w-auto"
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
            <h2 id="footer-shop" className="vc-fig mb-4 text-muted">
              Shop
            </h2>
            <ul className="grid gap-2.5 text-[0.88rem] text-muted">
              {categories.slice(0, 6).map((c) => (
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
            <h2 id="footer-help" className="vc-fig mb-4 text-muted">
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
            <h2 className="vc-fig mb-4 text-muted">Reach us</h2>
            <ul className="grid gap-2.5 text-[0.88rem] text-muted">
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-live">
                  {SITE.email}
                </a>
              </li>
              <li>
                <a href={SITE.phoneHref} className="hover:text-live">
                  {SITE.phone}
                </a>
              </li>
              {SITE.hours.map((h) => (
                <li key={h.days} className="flex justify-between gap-4 tabular-nums">
                  <span>{h.days}</span>
                  <span className="text-faint">{h.time}</span>
                </li>
              ))}
            </ul>
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
