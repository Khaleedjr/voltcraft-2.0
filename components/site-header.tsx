"use client";

import { List, MagnifyingGlass, ShoppingCartSimple, WhatsappLogo, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "@/components/cart-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { Container } from "@/components/ui";
import { SITE } from "@/lib/site";

/**
 * The header carries commerce only: browse, search, cart. Company pages
 * (About, Contact, policies) live in the footer, where people look for them,
 * and in the mobile menu so they are reachable without scrolling.
 */
const SECONDARY_NAV = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/delivery", label: "Delivery & returns" },
] as const;

const iconButton =
  "relative grid size-10 place-items-center rounded-full border border-line bg-raised text-muted transition-[border-color,color,transform] duration-200 hover:border-ink hover:text-ink active:scale-95";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, ready } = useCart();
  // The menu remembers which route it was opened on, so navigating anywhere
  // closes it without an effect chasing the pathname.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const onShop = pathname.startsWith("/shop") || pathname.startsWith("/product");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    searchRef.current?.blur();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-ground/85 backdrop-blur-md">
      <Container>
        <div className="flex h-[68px] items-center gap-3 sm:gap-6">
          <Link href="/" className="shrink-0" aria-label={`${SITE.name} home`}>
            <Wordmark priority className="h-9 w-auto sm:h-10" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/shop"
              aria-current={onShop ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-[0.92rem] font-medium transition-colors ${
                onShop ? "bg-sheet text-ink" : "text-muted hover:text-ink"
              }`}
            >
              Shop
            </Link>
            <a
              href={SITE.printingUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-2 text-[0.92rem] font-medium text-muted transition-colors hover:text-ink"
            >
              3D printing
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <form
              onSubmit={submitSearch}
              role="search"
              className="hidden h-10 min-w-0 items-center gap-2 rounded-full border border-line bg-raised pl-4 pr-1.5 transition-colors focus-within:border-ink md:flex md:w-[240px] lg:w-[300px]"
            >
              <MagnifyingGlass size={16} weight="bold" className="shrink-0 text-faint" aria-hidden />
              <label htmlFor="site-search" className="sr-only">
                Search the catalogue
              </label>
              <input
                id="site-search"
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sensors, boards, motors"
                className="min-w-0 flex-1 bg-transparent text-[0.88rem] text-ink outline-none placeholder:text-faint"
              />
            </form>

            <ThemeToggle className="!size-10 !rounded-full bg-raised" />
            <Link
              href="/cart"
              className={iconButton}
              aria-label={ready ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
            >
              <ShoppingCartSimple size={18} weight="bold" aria-hidden />
              {ready && count > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 font-mono text-[0.66rem] font-semibold text-live-ink">
                  {count}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setOpenedAt(open ? null : pathname)}
              className={`${iconButton} lg:hidden`}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={18} weight="bold" aria-hidden /> : <List size={18} weight="bold" aria-hidden />}
            </button>
          </div>
        </div>

        <div id="mobile-nav" hidden={!open} className="pb-5 lg:hidden">
          <form
            onSubmit={submitSearch}
            role="search"
            className="mb-3 flex h-12 items-center gap-2 rounded-full border border-line bg-raised pl-4 pr-2 focus-within:border-ink md:hidden"
          >
            <MagnifyingGlass size={17} weight="bold" className="shrink-0 text-faint" aria-hidden />
            <label htmlFor="mobile-search" className="sr-only">
              Search the catalogue
            </label>
            <input
              id="mobile-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the catalogue"
              className="min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-faint"
            />
          </form>
          <nav className="grid gap-1 rounded-2xl border border-line-soft bg-raised p-2">
            <Link href="/shop" className="rounded-xl px-4 py-3 text-[1rem] font-semibold text-ink hover:bg-sheet">
              Shop
            </Link>
            <a href={SITE.printingUrl} target="_blank" rel="noreferrer" className="rounded-xl px-4 py-3 text-[1rem] text-muted hover:bg-sheet">
              3D printing
            </a>
            {SECONDARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl px-4 py-3 text-[1rem] text-muted hover:bg-sheet">
                {item.label}
              </Link>
            ))}
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-2 rounded-xl bg-sheet px-4 py-3 text-[1rem] font-semibold text-ink"
            >
              <WhatsappLogo size={20} weight="fill" className="text-earth" aria-hidden /> Message us on WhatsApp
            </a>
          </nav>
        </div>
      </Container>
    </header>
  );
}
