/**
 * The hero's figure: a control board drawn the way the rest of the site is
 * drawn — a plate on the drawing sheet, prussian line work, current in gold.
 *
 * It replaces the stack of product cards that used to sit here. Those put four
 * bright photo plates in the hero, which on the dark theme were the loudest
 * thing on the page, and every one of those products appears again further
 * down under the aisles and the sale row.
 *
 * Every colour is a token, so it follows the theme; being line work rather
 * than a photograph it stays sharp at any size, costs a couple of kilobytes,
 * and needs nothing fetched.
 */
export function HeroFigure() {
  return (
    <figure className="mx-auto w-full max-w-[460px]">
      <svg viewBox="0 0 520 440" className="w-full" role="img" aria-label="Schematic of a microcontroller board">
        {/* registration ticks, as on a drawing sheet */}
        <g stroke="var(--vc-line)" strokeWidth="1.5" fill="none">
          <path d="M4 22V4h18M498 4h18v18M516 418v18h-18M22 436H4v-18" />
        </g>

        {/* the board */}
        <rect x="44" y="44" width="432" height="352" rx="16"
              fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.5" />
        <g stroke="var(--vc-line)" strokeWidth="1.5" fill="var(--vc-sheet)">
          <circle cx="74" cy="74" r="7" />
          <circle cx="446" cy="74" r="7" />
          <circle cx="74" cy="366" r="7" />
          <circle cx="446" cy="366" r="7" />
        </g>

        {/* edge connectors: USB, then power in */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5">
          <rect x="20" y="140" width="42" height="58" rx="3" />
          <rect x="28" y="150" width="26" height="38" rx="2" fill="none" />
          <rect x="20" y="236" width="42" height="44" rx="6" />
          <circle cx="41" cy="258" r="7" fill="none" />
        </g>

        {/* pin headers, top and bottom */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.2">
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={`t${i}`} x={132 + i * 22} y="64" width="12" height="12" rx="1.5" />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={`b${i}`} x={132 + i * 22} y="356" width="12" height="12" rx="1.5" />
          ))}
        </g>

        {/* the microcontroller */}
        <rect x="212" y="176" width="112" height="88" rx="5"
              fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
        <circle cx="225" cy="189" r="3.5" fill="var(--vc-muted)" />
        <g stroke="var(--vc-muted)" strokeWidth="1.4">
          {Array.from({ length: 6 }, (_, i) => (
            <path key={`p${i}`} d={`M${232 + i * 17} 176v-9M${232 + i * 17} 264v9`} />
          ))}
        </g>

        {/* discrete parts: crystal, two electrolytics, a resistor, a small IC */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5">
          <rect x="346" y="196" width="46" height="24" rx="12" />
          <circle cx="138" cy="206" r="16" />
          <circle cx="176" cy="206" r="16" />
          <rect x="130" y="286" width="50" height="15" rx="3" />
          <rect x="352" y="286" width="58" height="36" rx="3" />
        </g>
        <g stroke="var(--vc-muted)" strokeWidth="1.3">
          <path d="M138 194v24M176 194v24" />
          <path d="M144 286v15M156 286v15M168 286v15" />
          <path d="M352 298h58" />
        </g>

        {/* structural traces */}
        <g fill="none" stroke="var(--vc-line)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M62 258h42v42h26" />
          <path d="M155 301v55" />
          <path d="M324 240h56v46" />
          <path d="M410 304h36v36" />
          <path d="M157 222v40" />
        </g>

        {/* and the live ones */}
        <g fill="none" stroke="var(--vc-gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M212 196h-26v-76h-32V76" />
          <path d="M324 208h22" />
          <path d="M268 264v56h-58v36" />
          <path d="M62 169h48v63h102" />
        </g>
        <g fill="var(--vc-gold)">
          <circle cx="212" cy="196" r="3.5" />
          <circle cx="154" cy="76" r="3.5" />
          <circle cx="268" cy="264" r="3.5" />
          <circle cx="210" cy="356" r="3.5" />
          <circle cx="212" cy="232" r="3.5" />
        </g>

        {/* a dimension line, because the sheet always carries one */}
        <g stroke="var(--vc-faint)" strokeWidth="1.2">
          <path d="M44 416h432M44 410v12M476 410v12" />
        </g>
      </svg>
      <figcaption className="vc-fig mt-4 text-center text-faint">
        Fig. 01 — the board, and everything that plugs into it
      </figcaption>
    </figure>
  );
}
