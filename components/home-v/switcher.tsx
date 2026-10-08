import Link from "next/link";

export const VERSIONS = [
  { n: 1, name: "Drawing sheet" },
  { n: 2, name: "Centre stage" },
  { n: 3, name: "Split screen" },
  { n: 4, name: "Night shift" },
  { n: 5, name: "Shop window" },
] as const;

/**
 * A bar pinned to the bottom of each home page version, to flip between them
 * while choosing. It goes with the preview pages, once one is picked.
 */
export function VersionSwitcher({ current }: { current: number }) {
  const at = VERSIONS.findIndex((v) => v.n === current);
  const prev = VERSIONS[(at + VERSIONS.length - 1) % VERSIONS.length];
  const next = VERSIONS[(at + 1) % VERSIONS.length];
  return (
    <nav
      aria-label="Home page versions"
      className="fixed inset-x-0 bottom-3 z-50 mx-auto flex w-fit max-w-[calc(100%-24px)] items-center gap-1 border border-ink bg-ink p-1 text-ground shadow-[0_14px_40px_-12px_rgba(0,0,0,0.45)]"
    >
      <Link href={`/preview/${prev.n}`} className="grid size-9 place-items-center hover:bg-gold hover:text-live-ink" aria-label={`Version ${prev.n}: ${prev.name}`}>
        ←
      </Link>
      {VERSIONS.map((v) => (
        <Link
          key={v.n}
          href={`/preview/${v.n}`}
          aria-current={v.n === current ? "page" : undefined}
          className={`grid h-9 min-w-9 place-items-center px-2 font-mono text-[0.8rem] ${
            v.n === current ? "bg-gold text-live-ink" : "hover:bg-white/10"
          }`}
        >
          {v.n}
        </Link>
      ))}
      <span className="hidden px-3 font-mono text-[0.7rem] uppercase tracking-[0.16em] sm:inline">{VERSIONS[at].name}</span>
      <Link href={`/preview/${next.n}`} className="grid size-9 place-items-center hover:bg-gold hover:text-live-ink" aria-label={`Version ${next.n}: ${next.name}`}>
        →
      </Link>
    </nav>
  );
}
