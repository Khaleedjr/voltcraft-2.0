/**
 * The hero's figure: a control board drawn the way the rest of the site is
 * drawn — a plate on the drawing sheet, prussian line work, current in gold.
 *
 * It replaces the stack of product cards that used to sit here. Those put four
 * bright photo plates in the hero, which on the dark theme were the loudest
 * thing on the page, and every one of those products appears again further
 * down under the aisles and the sale row.
 *
 * The board is drawn the way a board actually is: pads are rings with a hole
 * through them and pin 1 is square, the chip is a quad-flat pack with legs on
 * all four sides and a notch on its top edge, and the traces leave a pad
 * straight, turn at 45 degrees and arrive square — which is what makes a real
 * PCB look like one. Nothing crosses anything; where a trace ends short it
 * ends on a via, as it would on a board with a second layer.
 *
 * Every colour is a token, so it follows the theme; being line work rather
 * than a photograph it stays sharp at any size, costs a couple of kilobytes,
 * and needs nothing fetched.
 */

/** A through-hole pad: a ring with a hole. Pin 1 is square, as on a real board. */
function Pad({ x, y, first = false }: { x: number; y: number; first?: boolean }) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width="13"
        height="13"
        rx={first ? 1 : 6.5}
        fill="var(--vc-sheet)"
        stroke="var(--vc-line)"
        strokeWidth="1.3"
      />
      <circle cx={x + 6.5} cy={y + 6.5} r="2.6" fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1" />
    </>
  );
}

const HEADER_X = Array.from({ length: 13 }, (_, i) => 132 + i * 22);
/** The quad-flat pack's legs, stepped along each edge. */
const CHIP_TOP_X = Array.from({ length: 9 }, (_, i) => 202 + i * 13);
const CHIP_SIDE_Y = Array.from({ length: 8 }, (_, i) => 174 + i * 12);

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
              fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.6" />
        <g fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.5">
          <circle cx="74" cy="74" r="8" />
          <circle cx="446" cy="74" r="8" />
          <circle cx="74" cy="366" r="8" />
          <circle cx="446" cy="366" r="8" />
        </g>
        <g fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.2">
          <circle cx="74" cy="74" r="3.5" />
          <circle cx="446" cy="74" r="3.5" />
          <circle cx="74" cy="366" r="3.5" />
          <circle cx="446" cy="366" r="3.5" />
        </g>

        {/* edge connectors: usb, then power in */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6">
          <rect x="20" y="140" width="42" height="58" rx="3" />
          <rect x="28" y="150" width="26" height="38" rx="2" fill="none" />
          <rect x="20" y="236" width="42" height="44" rx="6" />
          <circle cx="41" cy="258" r="7" fill="none" />
        </g>

        {/* pin headers, top and bottom */}
        {HEADER_X.map((x, i) => (
          <Pad key={`t${x}`} x={x} y={64} first={i === 0} />
        ))}
        {HEADER_X.map((x, i) => (
          <Pad key={`b${x}`} x={x} y={356} first={i === 0} />
        ))}

        {/* the microcontroller: legs on all four sides, notch on the top edge */}
        <g fill="var(--vc-muted)">
          {CHIP_TOP_X.map((x) => (
            <rect key={`ct${x}`} x={x} y="160" width="4" height="9" rx="1" />
          ))}
          {CHIP_TOP_X.map((x) => (
            <rect key={`cb${x}`} x={x} y="267" width="4" height="9" rx="1" />
          ))}
          {CHIP_SIDE_Y.map((y) => (
            <rect key={`cl${y}`} x="191" y={y} width="9" height="4" rx="1" />
          ))}
          {CHIP_SIDE_Y.map((y) => (
            <rect key={`cr${y}`} x="312" y={y} width="9" height="4" rx="1" />
          ))}
        </g>
        <rect x="200" y="168" width="112" height="100" rx="5"
              fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
        <path d="M244 168a12 12 0 0 0 24 0" fill="none" stroke="var(--vc-muted)" strokeWidth="1.4" />
        <circle cx="213" cy="181" r="4.5" fill="none" stroke="var(--vc-muted)" strokeWidth="1.4" />

        {/* discrete parts: two electrolytics, a crystal, a regulator, a resistor,
            three ceramics and a small logic package */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6">
          <circle cx="118" cy="196" r="18" />
          <circle cx="160" cy="196" r="18" />
          <rect x="336" y="186" width="52" height="26" rx="13" />
          <rect x="328" y="192" width="8" height="14" rx="1.5" />
          <rect x="388" y="192" width="8" height="14" rx="1.5" />
          <rect x="100" y="286" width="66" height="46" rx="3" />
          <rect x="402" y="284" width="56" height="18" rx="3" />
          <rect x="352" y="326" width="62" height="40" rx="3" />
        </g>
        <g fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.3">
          <circle cx="118" cy="196" r="11" />
          <circle cx="160" cy="196" r="11" />
        </g>
        <g stroke="var(--vc-line)" strokeWidth="1.4" fill="none">
          {/* the polarity stripe down one side of each electrolytic */}
          <path d="M107 189a11 11 0 0 0 0 14" />
          <path d="M149 189a11 11 0 0 0 0 14" />
          {/* the regulator's tab, and the resistor's bands */}
          <path d="M100 298h66" />
          <path d="M416 284v18M428 284v18M440 284v18" />
          {/* the logic package's legs */}
          <path d="M362 326v-8M378 326v-8M394 326v-8M362 366v8M378 366v8M394 366v8" />
        </g>
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4">
          <rect x="260" y="292" width="26" height="13" rx="2" />
          <rect x="344" y="240" width="26" height="13" rx="2" />
          <rect x="236" y="118" width="13" height="26" rx="2" />
        </g>
        {/* the regulator's three legs */}
        <g stroke="var(--vc-muted)" strokeWidth="1.6" fill="none">
          <path d="M114 332v10M133 332v10M152 332v10" />
        </g>
        {/* a power indicator, lit, and a status one that is not */}
        <circle cx="104" cy="110" r="7" fill="var(--vc-gold)" />
        <circle cx="128" cy="110" r="7" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
        {/* reset */}
        <rect x="350" y="100" width="38" height="38" rx="4"
              fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
        <circle cx="369" cy="119" r="11" fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.4" />

        {/* structural traces — straight out, 45 degrees across, square in */}
        <g fill="none" stroke="var(--vc-line)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M118 214v26l20 20h40" />
          <path d="M160 214v22l24 24h7" />
          <path d="M270.5 77V148.5L282 160" />
          <path d="M380.5 77v71l-18 18v20" />
          <path d="M394 199h36v67" />
          <path d="M248.5 77v33" />
        </g>

        {/* and the live ones */}
        <g fill="none" stroke="var(--vc-gold)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M188.5 77V105.5L243 160" />
          <path d="M342.5 77V112.5L295 160" />
          <path d="M217 276v48.5L248.5 356" />
          <path d="M295 276v38.5L336.5 356" />
          <path d="M320 200h8" />
          <path d="M62 169h107l19 19h3" />
          <path d="M62 258h28l22 22v6" />
          <path d="M166 308h6l10.5 10.5V356" />
        </g>
        {/* vias, where a trace drops to the other side of the board */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.8">
          <circle cx="248.5" cy="110" r="3.5" />
          <circle cx="430" cy="266" r="3.5" />
        </g>
        {/* and the pads the live traces land on */}
        <g fill="var(--vc-gold)">
          <circle cx="188.5" cy="70.5" r="3.4" />
          <circle cx="342.5" cy="70.5" r="3.4" />
          <circle cx="182.5" cy="362.5" r="3.4" />
          <circle cx="248.5" cy="362.5" r="3.4" />
          <circle cx="336.5" cy="362.5" r="3.4" />
        </g>

        {/* silkscreen */}
        <text
          x="260"
          y="386"
          textAnchor="middle"
          fill="var(--vc-faint)"
          fontFamily="var(--font-mono)"
          fontSize="12"
          letterSpacing="3"
        >
          VOLTCRAFT
        </text>

        {/* a dimension line, because the sheet always carries one */}
        <g stroke="var(--vc-faint)" strokeWidth="1.2">
          <path d="M44 416h432M44 410v12M476 410v12" />
        </g>
      </svg>
      <figcaption className="vc-fig mt-4 text-center text-faint">
        Fig. 01 — the board everything else plugs into
      </figcaption>
    </figure>
  );
}
