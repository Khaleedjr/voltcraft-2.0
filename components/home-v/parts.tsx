import Link from "next/link";
import { AddKitToCart } from "@/components/add-kit-to-cart";
import { ProductImage } from "@/components/product-image";
import { discountPercent, type CategorySlug, type Product } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";
import type { HomeData } from "@/lib/home-data";
import { SITE } from "@/lib/site";

/** What a sale saves, in naira. */
export const saving = (p: Product) => (p.compareAt && p.compareAt > p.price ? p.compareAt - p.price : 0);
export const off = (p: Product) => discountPercent(p) ?? 0;

export const LEDE = "Sensors, microcontrollers, motors and every part in between, delivered across Nigeria.";

/** The kit: its parts as a bill of materials, the total, one button for all of it. */
export function KitPanel({ kit, stacked = false }: { kit: HomeData["kit"]; stacked?: boolean }) {
  if (!kit) return null;
  return (
    <div className={`grid gap-10 ${stacked ? "" : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14"}`}>
      <div>
        <p className="vc-fig text-live">{kit.figure} · A kit</p>
        <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.1] tracking-[-0.025em]">{kit.name}</h2>
        <p className="mt-4 max-w-[48ch] text-[0.95rem] leading-relaxed text-muted">{kit.blurb}</p>
        <p className="mt-6 flex items-baseline gap-3">
          <span className="vc-fig text-faint">All {kit.items.length} parts</span>
          <span className="font-display text-[2rem] leading-none tabular-nums">{formatNaira(kit.total)}</span>
        </p>
        <div className="mt-6">
          <AddKitToCart lines={kit.items.map((i) => ({ slug: i.product.slug, variant: i.variant, qty: i.qty }))} />
        </div>
      </div>
      <ol className="border-t border-line">
        {kit.items.map((i, n) => (
          <li key={`${i.product.slug}-${i.variant ?? ""}`} className="border-b border-line">
            <Link href={`/product/${i.product.slug}`} className="group grid grid-cols-[2rem_48px_minmax(0,1fr)_auto] items-center gap-3 py-2.5 sm:gap-4">
              <span className="vc-fig text-faint">{String(n + 1).padStart(2, "0")}</span>
              <ProductImage product={i.product} ratio="aspect-square" sizes="48px" pad="p-1" />
              <span className="min-w-0">
                <span className="block truncate text-[0.92rem] font-semibold group-hover:text-live">
                  {i.product.name}
                  {i.variant ? ` (${i.variant})` : ""}
                </span>
                <span className="block truncate text-[0.8rem] text-muted">{i.why}</span>
              </span>
              <span className="text-right font-mono text-[0.8rem] tabular-nums text-muted">
                {i.qty} × {formatNaira(i.lineTotal / i.qty)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The closing band: buying in quantity, talk to us. */
export function Talk({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden border border-line bg-block p-6 text-block-ink sm:p-10 ${className}`}>
      <div aria-hidden className="vc-wash-block pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="font-display text-[1.5rem] leading-tight tracking-[-0.02em] sm:text-[2rem]">Buying in quantity?</h2>
          <p className="mt-2 max-w-[44ch] text-[0.95rem] text-block-muted">
            Send the parts list and we&apos;ll price it, usually the same day.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center bg-gold px-6 py-3.5 text-[0.9rem] font-semibold text-live-ink transition-colors hover:bg-gold-hover"
          >
            Message us on WhatsApp
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center border border-block-line px-6 py-3.5 text-[0.9rem] font-semibold text-block-ink transition-colors hover:border-block-ink"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}

/** A line icon for each aisle, drawn as one path so it can be traced in. */
const ICONS: Record<CategorySlug, string> = {
  sensors: "M12 19.5a1.5 1.5 0 1 1 0-.01M8.2 15.8a5.4 5.4 0 0 1 7.6 0M5.3 12.9a9.5 9.5 0 0 1 13.4 0M2.5 10a13.4 13.4 0 0 1 19 0",
  microcontrollers: "M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4M10 10h4v4h-4z",
  display: "M3 5h18v11H3zM8 20h8M12 16v4M6.5 9.5h5M6.5 12.5h8",
  actuators: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1",
  connectors: "M9 3v5M15 3v5M6 8h12v3.5a6 6 0 0 1-12 0zM12 17.5V21",
  accessories: "M3 6h18v12H3zM3 10h18M7 13.5h.5M10.5 13.5h.5M14 13.5h.5M17 13.5h.5",
  switches: "M7 8h10a4 4 0 0 1 0 8H7a4 4 0 0 1 0-8zM16 10a2 2 0 1 0 0 4 2 2 0 1 0 0-4",
  power: "M3 8h15v8H3zM18 10.5h3v3h-3M10.5 9.5l-2 2.5h3l-2 2.5",
  "fluid-control": "M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11zM9 14.5a3 3 0 0 0 3 3",
};

export function AisleIcon({ slug, className = "" }: { slug: CategorySlug; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={ICONS[slug]} pathLength={100} />
    </svg>
  );
}
