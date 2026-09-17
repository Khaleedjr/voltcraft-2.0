/**
 * The hero's figure: a control board drawn the way the rest of the site is
 * drawn — a plate on the drawing sheet, prussian line work, current in gold.
 *
 * It replaces the stack of product cards that used to sit here. Those put four
 * bright photo plates in the hero, which on the dark theme were the loudest
 * thing on the page, and every one of those products appears again further
 * down under the aisles and the sale row.
 *
 * What makes a board drawing read as a board is the routing, so the routing is
 * the part that is done properly here:
 *
 *   - Pads are rings with a hole through them, and pin 1 of each header is
 *     square. The chip is a quad-flat pack with legs on all four sides, a notch
 *     on its top edge and the pin-1 dimple beside it.
 *   - Every trace leaves a pad straight, turns at 45 degrees and arrives
 *     square. Traces heading the same way turn at stepped heights so they nest
 *     into a fan instead of converging — the signature of a real layout.
 *   - No trace crosses another and none runs through a component body, because
 *     on a single layer neither can happen. Where a net has to get past
 *     something it ends on a via and continues on the other side.
 *   - Power is drawn heavier than signal, as it is laid out heavier.
 *
 * Each part carries its silkscreen designator, and the runs go between points
 * that would plausibly be connected: usb to the chip, barrel jack through the
 * regulator, the regulator's legs down to the power pins of the header, the
 * crystal to the two pins a crystal hangs off.
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

/** Where a net drops through to the other side of the board. */
function Via({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="3.6" fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.5" />
      <circle cx={x} cy={y} r="1.2" fill="var(--vc-raised)" />
    </>
  );
}

/** Silkscreen: the designator printed beside each part. */
function Ref({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="var(--vc-faint)"
      fontFamily="var(--font-mono)"
      fontSize="9"
      letterSpacing="0.5"
    >
      {children}
    </text>
  );
}

const HEADER_X = Array.from({ length: 13 }, (_, i) => 128 + i * 22);
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

        {/* the board, and the keepout line inside its edge */}
        <rect x="44" y="44" width="432" height="352" rx="16"
              fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.6" />
        <rect x="54" y="54" width="412" height="332" rx="10"
              fill="none" stroke="var(--vc-line-soft)" strokeWidth="1.2" />

        {/* ---------------------------------------------------------- traces */}
        {/* signal */}
        <g fill="none" stroke="var(--vc-trace)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M217 160 V137.5 L156.5 77" />
          <path d="M230 160 V128.5 L178.5 77" />
          <path d="M256 160 V109.5 L288.5 77" />
          <path d="M269 160 V118.5 L310.5 77" />
          <path d="M282 160 V127.5 L332.5 77" />
          <path d="M295 160 V136.5 L354.5 77" />
          <path d="M192 188 H176" />
          <path d="M192 200 H188 L182 194" />
          <path d="M192 212 H180 L174 206" />
          <path d="M192 224 H184 L178 230" />
          <path d="M192 236 H186 L180 242" />
          <path d="M192 248 H174 V276 L168 282 H162" />
          <path d="M94 206 H80 V262 L86 268 H62" />
          <path d="M156 224 V262 L150 268" />
          <path d="M320 188 H332" />
          <path d="M320 200 H328" />
          <path d="M320 212 H330" />
          <path d="M320 224 H336 L344 232" />
          <path d="M320 236 H330 L336 242" />
          <path d="M320 260 H330 L336 266" />
          <path d="M217 276 V328.5 L244.5 356" />
          <path d="M230 276 V319.5 L266.5 356" />
          <path d="M243 276 V310.5 L288.5 356" />
          <path d="M256 276 V301.5 L310.5 356" />
          <path d="M269 276 V292.5 L332.5 356" />
          <path d="M295 276 V292 L307 304 H386" />
          <path d="M308 276 V282 L314 288 H386" />
        </g>
        {/* live */}
        <g fill="none" stroke="var(--vc-gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M204 160 V146.5 L134.5 77" />
          <path d="M243 160 V100.5 L266.5 77" />
          <path d="M308 160 V145.5 L376.5 77" />
          <path d="M192 176 H108 L101 169 H62" />
          <path d="M320 176 H370 L404 142 V128" />
          <path d="M320 248 H366 L386 268" />
          <path d="M192 260 H186 V341.5 L200.5 356" />
          <path d="M204 276 V337.5 L222.5 356" />
          <path d="M282 276 V283.5 L354.5 356" />
        </g>
        {/* power, laid heavier */}
        <g fill="none" stroke="var(--vc-gold)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M62 276 H96" />
          <path d="M114 324 V335.5 L134.5 356" />
          <path d="M133 324 V332.5 L156.5 356" />
          <path d="M152 324 V329.5 L178.5 356" />
        </g>

        {/* --------------------------------------------------------- hardware */}
        {/* mounting holes */}
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

        {/* vias */}
        <Via x={176} y={188} />
        <Via x={182} y={194} />
        <Via x={178} y={230} />
        <Via x={180} y={242} />
        <Via x={332} y={188} />
        <Via x={330} y={212} />
        <Via x={336} y={242} />
        <Via x={336} y={266} />

        {/* the microcontroller: legs on all four sides, notch on the top edge */}
        <g fill="var(--vc-muted)">
          {CHIP_TOP_X.map((x) => (
            <rect key={`ct${x}`} x={x} y="160" width="4" height="8" rx="1" />
          ))}
          {CHIP_TOP_X.map((x) => (
            <rect key={`cb${x}`} x={x} y="268" width="4" height="8" rx="1" />
          ))}
          {CHIP_SIDE_Y.map((y) => (
            <rect key={`cl${y}`} x="192" y={y} width="8" height="4" rx="1" />
          ))}
          {CHIP_SIDE_Y.map((y) => (
            <rect key={`cr${y}`} x="312" y={y} width="8" height="4" rx="1" />
          ))}
        </g>
        <rect x="200" y="168" width="112" height="100" rx="5"
              fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
        <path d="M244 168a12 12 0 0 0 24 0" fill="none" stroke="var(--vc-muted)" strokeWidth="1.4" />
        <circle cx="213" cy="181" r="4.5" fill="none" stroke="var(--vc-muted)" strokeWidth="1.4" />

        {/* discrete parts */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6">
          <circle cx="112" cy="206" r="18" />
          <circle cx="156" cy="206" r="18" />
          <rect x="336" y="186" width="52" height="26" rx="13" />
          <rect x="328" y="193" width="8" height="14" rx="1.5" />
          <rect x="388" y="193" width="8" height="14" rx="1.5" />
          <rect x="96" y="268" width="66" height="46" rx="3" />
          <rect x="396" y="110" width="56" height="18" rx="3" />
          <rect x="344" y="232" width="26" height="13" rx="2" />
          <rect x="344" y="266" width="26" height="13" rx="2" />
          <rect x="386" y="268" width="62" height="40" rx="3" />
          <rect x="112" y="104" width="40" height="36" rx="4" />
          <rect x="168" y="140" width="13" height="26" rx="2" />
        </g>
        <g fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.3">
          <circle cx="112" cy="206" r="11" />
          <circle cx="156" cy="206" r="11" />
          <circle cx="132" cy="122" r="11" />
        </g>
        <g stroke="var(--vc-line)" strokeWidth="1.4" fill="none">
          {/* the polarity stripe down one side of each electrolytic */}
          <path d="M101 199a11 11 0 0 0 0 14" />
          <path d="M145 199a11 11 0 0 0 0 14" />
          {/* the regulator's tab, and the resistor's bands */}
          <path d="M96 280h66" />
          <path d="M410 110v18M422 110v18M434 110v18" />
        </g>
        {/* the regulator's three legs, and the logic package's */}
        <g stroke="var(--vc-muted)" strokeWidth="2.2" fill="none">
          <path d="M114 314v10M133 314v10M152 314v10" />
        </g>
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4">
          <rect x="396" y="260" width="6" height="8" rx="1" />
          <rect x="412" y="260" width="6" height="8" rx="1" />
          <rect x="428" y="260" width="6" height="8" rx="1" />
          <rect x="396" y="308" width="6" height="8" rx="1" />
          <rect x="412" y="308" width="6" height="8" rx="1" />
          <rect x="428" y="308" width="6" height="8" rx="1" />
        </g>
        {/* a power indicator, lit, and a status one that is not */}
        <circle cx="86" cy="118" r="7" fill="var(--vc-gold)" />
        <circle cx="86" cy="146" r="7" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />

        {/* ------------------------------------------------------- silkscreen */}
        <Ref x={256} y={226}>U1</Ref>
        <Ref x={112} y={182}>C1</Ref>
        <Ref x={156} y={182}>C2</Ref>
        <Ref x={174} y={176}>C3</Ref>
        <Ref x={362} y={224}>Y1</Ref>
        <Ref x={357} y={257}>C4</Ref>
        <Ref x={132} y={98}>SW1</Ref>
        <Ref x={86} y={104}>D1</Ref>
        <Ref x={86} y={132}>D2</Ref>
        <Ref x={424} y={104}>R1</Ref>
        <Ref x={129} y={262}>U2</Ref>
        <Ref x={417} y={326}>U3</Ref>
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
