"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/admin/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/app/admin/login/actions";

export type NavCounts = { toFulfil: number; attention: number; lowStock: number };

const NAV = [
  { href: "/admin", label: "Overview", icon: Icon.Overview, exact: true },
  { href: "/admin/orders", label: "Orders", icon: Icon.Orders, badge: "orders" },
  { href: "/admin/products", label: "Products", icon: Icon.Products },
  { href: "/admin/stock", label: "Stock", icon: Icon.Stock, badge: "stock" },
  { href: "/admin/customers", label: "Customers", icon: Icon.Customers },
  { href: "/admin/analytics", label: "Analytics", icon: Icon.Analytics },
] as const;

function NavList({ counts, onNavigate }: { counts: NavCounts | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="grid gap-0.5">
      {NAV.map((item) => {
        const active = "exact" in item ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const badge =
          "badge" in item && counts
            ? item.badge === "orders"
              ? { n: counts.toFulfil + counts.attention, warn: counts.attention > 0, label: "orders need action" }
              : { n: counts.lowStock, warn: false, label: "lines low or out of stock" }
            : null;
        const I = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 border-l-2 px-3 py-2.5 text-[0.9rem] font-semibold transition-colors ${
                active ? "border-gold bg-raised text-ink" : "border-transparent text-muted hover:bg-raised/60 hover:text-ink"
              }`}
            >
              <I className={`size-[18px] ${active ? "text-live" : "text-faint group-hover:text-muted"}`} />
              <span className="flex-1">{item.label}</span>
              {badge && badge.n > 0 ? (
                <span
                  title={`${badge.n} ${badge.label}`}
                  className={`min-w-6 px-1.5 py-0.5 text-center font-mono text-[0.72rem] tabular-nums ${
                    badge.warn ? "bg-warn text-ground" : "bg-gold text-live-ink"
                  }`}
                >
                  {badge.n}
                  <span className="sr-only"> {badge.label}</span>
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Footer({ name, email }: { name: string; email: string }) {
  return (
    <div className="grid gap-3 border-t border-line pt-4">
      <div className="flex items-center justify-between gap-2 px-3">
        <Link href="/" className="inline-flex items-center gap-2 text-[0.84rem] font-semibold text-muted hover:text-live">
          <Icon.Shop className="size-4" /> View the shop
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex items-center gap-3 px-3">
        <span className="grid size-8 shrink-0 place-items-center bg-ink font-display text-[0.8rem] text-ground" aria-hidden>
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[0.84rem] font-semibold">{name}</p>
          <p className="truncate text-[0.74rem] text-faint">{email}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="grid size-8 place-items-center text-faint hover:text-warn" title="Sign out">
            <Icon.SignOut className="size-[18px]" />
            <span className="sr-only">Sign out</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-baseline gap-2 px-3">
      <span className="font-display text-[1.15rem] font-bold tracking-[-0.02em]">
        VOLT<span className="text-live">CRAFT</span>
      </span>
      <span className="vc-fig text-faint">Admin</span>
    </Link>
  );
}

export function AdminSidebar({
  session,
  counts,
}: {
  session: { name: string; email: string } | null;
  counts: NavCounts | null;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-sheet px-3 py-5 lg:flex print:hidden">
      <Brand />
      <nav aria-label="Admin" className="flex-1 overflow-y-auto">
        <NavList counts={counts} />
      </nav>
      {session ? <Footer name={session.name} email={session.email} /> : null}
    </aside>
  );
}

export function AdminTopbar({
  session,
  counts,
}: {
  session: { name: string; email: string } | null;
  counts: NavCounts | null;
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  // Links close it themselves (onNavigate). Here: Escape closes it, focus moves
  // into it, and the page does not scroll underneath while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const pending = counts ? counts.toFulfil + counts.attention + counts.lowStock : 0;

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-sheet/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
      <Brand />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative grid size-10 place-items-center border border-line bg-raised"
        aria-label="Open admin menu"
        aria-expanded={open}
      >
        <Icon.Menu />
        {pending > 0 ? <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-gold" aria-hidden /> : null}
      </button>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(20,16,10,0.45)]"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div ref={panel} className="absolute inset-y-0 left-0 flex w-[min(84vw,300px)] flex-col gap-6 border-r border-line bg-sheet px-3 py-5">
            <div className="flex items-center justify-between pr-1">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center text-muted" aria-label="Close menu">
                <Icon.Close />
              </button>
            </div>
            <nav aria-label="Admin" className="flex-1 overflow-y-auto">
              <NavList counts={counts} onNavigate={() => setOpen(false)} />
            </nav>
            {session ? <Footer name={session.name} email={session.email} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
