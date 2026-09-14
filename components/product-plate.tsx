import type { CategorySlug } from "@/lib/catalogue";

/**
 * VoltCraft has no product photography yet, so a listing shows a drawing-sheet
 * plate instead of a broken frame: registration ticks, the SKU, and a schematic
 * glyph for the aisle it belongs to. Swap this for <Image> once photos exist.
 */

const GLYPHS: Record<CategorySlug, React.ReactNode> = {
  sensors: (
    <>
      <circle cx="30" cy="48" r="4" />
      <path d="M44 34a20 20 0 0 1 0 28M56 26a32 32 0 0 1 0 44M68 18a44 44 0 0 1 0 60" />
    </>
  ),
  microcontrollers: (
    <>
      <rect x="26" y="26" width="44" height="44" />
      <circle cx="34" cy="34" r="2.5" />
      <path d="M34 26v-8M48 26v-8M62 26v-8M34 70v8M48 70v8M62 70v8M26 34h-8M26 48h-8M26 62h-8M70 34h8M70 48h8M70 62h8" />
    </>
  ),
  display: (
    <>
      <rect x="14" y="26" width="68" height="44" rx="2" />
      <path d="M24 40h30M24 50h44M24 60h20" />
    </>
  ),
  actuators: (
    <>
      <circle cx="48" cy="48" r="18" />
      <path d="M48 30v-12M48 78v-12M30 48H18M78 48H66" />
      <path d="M48 48 60 40" />
      <circle cx="48" cy="48" r="3" />
    </>
  ),
  connectors: (
    <>
      <path d="M14 38h26v20H14zM40 44h14M40 52h14" />
      <path d="M82 38H56v20h26" />
      <path d="M68 30v8M76 30v8" />
    </>
  ),
  accessories: (
    <>
      <rect x="16" y="24" width="64" height="48" />
      <path d="M48 24v48" />
      <path d="M26 36h.01M34 36h.01M42 36h.01M26 46h.01M34 46h.01M42 46h.01M26 56h.01M34 56h.01M42 56h.01M54 36h.01M62 36h.01M70 36h.01M54 46h.01M62 46h.01M70 46h.01M54 56h.01M62 56h.01M70 56h.01" strokeLinecap="round" strokeWidth="3.5" />
    </>
  ),
  switches: (
    <>
      <path d="M14 58h22" />
      <path d="M36 58 66 34" />
      <circle cx="36" cy="58" r="3.5" />
      <circle cx="70" cy="58" r="3.5" />
      <path d="M74 58h8" />
    </>
  ),
  power: (
    <>
      <rect x="18" y="34" width="56" height="30" rx="1" />
      <path d="M74 43h6v12h-6" />
      <path d="M48 38l-9 14h9l-3 10 11-14h-9z" />
    </>
  ),
  "fluid-control": (
    <>
      <path d="M14 48h20M62 48h20" />
      <path d="M34 34v28l28-28v28z" />
      <path d="M48 34V20M40 20h16" />
    </>
  ),
};

export function ProductPlate({
  category,
  label,
  className = "",
  ratio = "aspect-[4/3]",
}: {
  category: CategorySlug;
  label?: string;
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

      {label ? (
        <span className="vc-fig absolute bottom-3 left-4 right-4 truncate text-faint">{label}</span>
      ) : null}
    </div>
  );
}
