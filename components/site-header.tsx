"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "@/components/cart-context";
import { Container } from "@/components/ui";
import { SITE } from "@/lib/site";

/**
 * The header carries commerce only — browse, search, quote, cart. Company
 * pages (About, Contact, policies) live in the footer, where people look for
 * them, and stay in the mobile menu so they are reachable without scrolling.
 */
const SECONDARY_NAV = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/delivery", label: "Delivery & returns" },
] as const;

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
    <header className="sticky top-0 z-40 border-b border-line bg-ground/92 backdrop-blur-sm">
      <Container>
        <div className="flex items-center gap-3 py-3.5 sm:gap-6">
          <Link href="/" className="shrink-0" aria-label={`${SITE.name} home`}>
            <Image
              src="/brand/voltcraft-wordmark.png"
              alt={SITE.name}
              width={1200}
              height={724}
              priority
              className="h-10 w-auto sm:h-11"
            />
          </Link>

          <nav className="hidden lg:block">
            <Link
              href="/shop"
              aria-current={onShop ? "page" : undefined}
              className={`border-b-2 pb-0.5 text-[0.92rem] font-medium transition-colors ${
                onShop
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:border-line hover:text-ink"
              }`}
            >
              Shop
            </Link>
          </nav>

          <form
            onSubmit={submitSearch}
            role="search"
            className="ml-auto hidden min-w-0 flex-1 items-center border border-line bg-raised focus-within:border-ink md:flex md:max-w-[340px]"
          >
            <label htmlFor="site-search" className="sr-only">
              Search the catalogue
            </label>
            <input
              id="site-search"
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the catalogue"
              className="min-w-0 flex-1 bg-transparent px-3.5 py-2 text-[0.88rem] text-ink outline-none placeholder:text-faint"
            />
            <button
              type="submit"
              className="grid size-9 shrink-0 place-items-center text-muted hover:text-live"
              aria-label="Search"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0 md:gap-3">
            <a
              href={SITE.quoteUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden border border-line px-3.5 py-2 text-[0.85rem] font-medium text-muted transition-colors hover:border-ink hover:text-ink lg:inline-block"
            >
              Bulk quote
            </a>
            <Link
              href="/cart"
              className="relative grid size-9 place-items-center border border-line text-muted transition-colors hover:border-ink hover:text-ink"
              aria-label={ready ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M3 4h2.2l2.3 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.55L21 8H6" />
                <circle cx="10" cy="20" r="1.3" />
                <circle cx="18" cy="20" r="1.3" />
              </svg>
              {ready && count > 0 ? (
                <span className="absolute -right-2 -top-2 grid min-w-5 place-items-center bg-live px-1 font-mono text-[0.62rem] font-semibold leading-5 text-live-ink">
                  {count}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setOpenedAt(open ? null : pathname)}
              className="grid size-9 place-items-center border border-line text-muted transition-colors hover:border-ink hover:text-ink lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                {open ? <path d="M5 5l14 14M19 5 5 19" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        <div id="mobile-nav" hidden={!open} className="border-t border-line py-4 lg:hidden">
          <form onSubmit={submitSearch} role="search" className="mb-4 flex border border-line bg-raised md:hidden">
            <label htmlFor="mobile-search" className="sr-only">
              Search the catalogue
            </label>
            <input
              id="mobile-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the catalogue"
              className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-[0.9rem] outline-none placeholder:text-faint"
            />
            <button type="submit" className="px-4 text-muted" aria-label="Search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </form>
          <nav className="flex flex-col">
            <Link href="/shop" className="border-b border-line py-3 text-[0.95rem] font-medium text-ink">
              Shop
            </Link>
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-line py-3 text-[0.95rem] text-muted"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={SITE.quoteUrl}
              target="_blank"
              rel="noreferrer"
              className="py-3 text-[0.95rem] font-medium text-live"
            >
              Request a bulk quote →
            </a>
          </nav>
        </div>
      </Container>
    </header>
  );
}
