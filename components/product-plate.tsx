import type { CategorySlug } from "@/lib/catalogue";

/**
 * VoltCraft has no product photography yet, so a listing shows a drawing-sheet
 * plate instead of a broken frame: registration ticks, the SKU, and a schematic
 * glyph for the aisle it belongs to. Swap this for <Image> once photos exist.
 */

const GLYPHS: Record<CategorySlug, React.ReactNode> = {
  "dev-boards": (
    <>
      <rect x="26" y="26" width="44" height="44" />
      <circle cx="34" cy="34" r="2.5" />
      <path d="M34 26v-8M48 26v-8M62 26v-8M34 70v8M48 70v8M62 70v8M26 34h-8M26 48h-8M26 62h-8M70 34h8M70 48h8M70 62h8" />
    </>
  ),
  components: (
    <>
      <path d="M14 48h16l5-14 10 28 10-28 5 14h16" />
      <circle cx="14" cy="48" r="2.5" />
      <circle cx="82" cy="48" r="2.5" />
    </>
  ),
  sensors: (
    <>
      <circle cx="30" cy="48" r="4" />
      <path d="M44 34a20 20 0 0 1 0 28M56 26a32 32 0 0 1 0 44M68 18a44 44 0 0 1 0 60" />
    </>
  ),
  "test-measurement": (
    <>
      <path d="M20 62a28 28 0 0 1 56 0" />
      <path d="M48 62 62 38" />
      <circle cx="48" cy="62" r="3.5" />
      <path d="M22 52l-5-2M31 38l-4-4M48 32v-5M65 38l4-4M74 52l5-2" />
    </>
  ),
  soldering: (
    <>
      <path d="M62 30 78 22 70 38z" />
      <path d="M62 30 34 58" />
      <rect x="16" y="58" width="22" height="12" rx="1" transform="rotate(-45 27 64)" />
      <path d="M58 20c4-4 0-8 4-12M68 16c4-4 0-8 4-12" />
    </>
  ),
  power: (
    <>
      <rect x="18" y="34" width="56" height="30" rx="1" />
      <path d="M74 43h6v12h-6" />
      <path d="M48 38l-9 14h9l-3 10 11-14h-9z" />
    </>
  ),
  prototyping: (
    <>
      <rect x="16" y="24" width="64" height="48" />
      <path d="M48 24v48" />
      <path d="M26 36h.01M34 36h.01M42 36h.01M26 46h.01M34 46h.01M42 46h.01M26 56h.01M34 56h.01M42 56h.01M54 36h.01M62 36h.01M70 36h.01M54 46h.01M62 46h.01M70 46h.01M54 56h.01M62 56h.01M70 56h.01" strokeLinecap="round" strokeWidth="3.5" />
    </>
  ),
  workbench: (
    <>
      <path d="M14 40h60v10H14z" />
      <path d="M30 50v14M30 64h10V50" />
      <path d="M74 40V28h8v34h-8V50" />
      <path d="M20 40V32" />
    </>
  ),
};

export function ProductPlate({
  category,
  sku,
  className = "",
  ratio = "aspect-[4/3]",
}: {
  category: CategorySlug;
  sku: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div
      className={`relative ${ratio} w-full max-w-full overflow-hidden border border-line bg-sheet ${className}`}
    >
      {/* registration ticks, as on a drawing sheet */}
      <span className="pointer-events-none absolute left-2 top-2 size-3 border-l border-t border-line" aria-hidden />
      <span className="pointer-events-none absolute right-2 top-2 size-3 border-r border-t border-line" aria-hidden />
      <span className="pointer-events-none absolute bottom-2 left-2 size-3 border-b border-l border-line" aria-hidden />
      <span className="pointer-events-none absolute bottom-2 right-2 size-3 border-b border-r border-line" aria-hidden />

      <svg
        viewBox="0 0 96 96"
        className="absolute inset-0 m-auto size-[52%] text-line"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        aria-hidden
      >
        {GLYPHS[category]}
      </svg>

      <span className="vc-fig absolute bottom-3 left-4 text-faint">{sku}</span>
    </div>
  );
}
