import Link from "next/link";

/**
 * The hero's figure: an Arduino Uno, drawn the way the rest of the site is
 * drawn — a plate on the drawing sheet, line work in ink, current in gold.
 *
 * It is a replica rather than a generic board, so it is built to the real
 * thing's proportions: 68.6 x 53.4mm, which is the 540 x 420 the board is
 * drawn at here, at 7.87 units to the millimetre. Everything else follows from
 * that scale — 2.54mm header pitch is 20 units, a DIP-28's body is 276 long,
 * an 0805 passive is 16 x 10.
 *
 * What makes it read as an Uno at a glance is the silhouette, in this order:
 * the outline itself, with its square top-right corner stepped in above the
 * chamfer while the other three are rounded; the USB-B and the barrel jack
 * standing off the left edge; the four header groups with the famous 0.16in
 * break between D7 and D8; and the DIP-28 in its socket across the lower half.
 * Those are what is drawn most carefully.
 *
 * The routing is done the way a board is routed:
 *
 *   - Pads are rings with a hole through them, and pin 1 of each header is
 *     square. The DIP has its end notch and a pin-1 dimple beside it.
 *   - Every trace leaves a pad straight, turns at 45 degrees and arrives
 *     square. No trace crosses another and none runs through a component body,
 *     because on this layer neither can happen. Where a net has to get past
 *     something — or, as on the real board, simply continues on the back — it
 *     ends on a via.
 *   - Power is drawn heavier than signal, as it is laid out heavier.
 *
 * The board is powered rather than posed: ON sits lit and breathing, L blinks
 * the way a fresh board's does, TX and RX flicker against each other, and
 * pulses of current run the live nets. It is CSS on SVG — no script, nothing
 * to hydrate — and it stops dead under prefers-reduced-motion, where the board
 * falls back to the drawing.
 *
 * And the parts are doors. Each one that maps honestly onto an aisle is a link
 * into it: the DIP to microcontrollers, the four header groups, the USB-B and
 * both ICSP headers to connectors, the barrel jack and the regulator to power,
 * the indicators to display, reset to switches. An Uno carries no sensor and
 * nothing that moves, so sensors and actuators have no door here — the
 * headline keeps its own Sensors link. The USB-serial chip, the crystal and
 * the electrolytics are drawn but are not doors: no aisle sells one.
 *
 * Because the drawing contains links it cannot be role="img": that role makes
 * everything inside it presentational and would hide every one of them from
 * assistive tech.
 */

/** The Uno's outline: three rounded corners, and the stepped, chamfered one. */
const BOARD =
  "M62 44 H572 V162 L592 182 V454 A10 10 0 0 1 582 464 H62 " +
  "A10 10 0 0 1 52 454 V54 A10 10 0 0 1 62 44 Z";
const BOARD_INSET =
  "M70 52 H564 V158 L584 178 V446 A8 8 0 0 1 576 454 H70 " +
  "A8 8 0 0 1 62 446 V60 A8 8 0 0 1 70 52 Z";

/** Signal runs: the fine copper that carries no current in this drawing. */
const SIGNAL = [
  /* D0-D7 drop through and run to the chip on the back, as they do */
  "M204 73 V86",
  "M224 73 V86",
  "M244 73 V86",
  "M264 73 V86",
  "M284 73 V86",
  "M304 73 V86",
  "M324 73 V86",
  "M344 73 V86",
  /* the three at the far end of the digital header do the same */
  "M516 73 V86",
  "M536 73 V86",
  "M556 73 V86",
  /* D8-D12 run straight down the open lane into the chip's top pins */
  "M376 73 V301",
  "M416 73 V301",
  "M456 73 V301",
  "M496 73 V301",
  /* the analog pins come up into the chip's bottom row */
  "M356 437 V384",
  "M396 437 V384",
  "M416 437 V384",
  "M456 437 V384",
  /* the crystal, onto the two pins beside it */
  "M248 282 V296 H267 L272 301",
  "M350 282 V295 L356 301",
  /* both ICSP headers continue on the back */
  "M516 251 V262",
  "M536 251 V262",
  "M556 251 V262",
  "M140 87 V100",
  "M160 87 V100",
  "M180 87 V100",
  /* reset, and the usb-serial chip's lines to the processor */
  "M129 96 V108",
  "M247 128 H262",
  "M247 146 H262",
  /* L is driven from D13 underneath */
  "M196 224 V236",
  /* the power header's rails all live in the pour */
  "M170 437 V430",
  "M190 437 V430",
  "M210 437 V430",
  "M230 437 V430",
  "M250 437 V430",
  "M270 437 V430",
  "M290 437 V430",
  "M310 437 V430",
];

/** Live runs: the ones the pulses travel. */
const LIVE = [
  /* usb data, across to the usb-serial chip */
  "M162 128 H180",
  "M162 146 H180",
  /* that chip driving the two serial indicators */
  "M195 171 V186",
  "M222 171 V186",
  /* three of the digital lines, running the length of the board */
  "M396 73 V301",
  "M436 73 V301",
  "M476 73 V301",
  /* two of the analog ones */
  "M376 437 V384",
  "M436 437 V384",
];

/** Power: the jack in, through the regulator, and 5V up to the ON indicator. */
const POWER = [
  "M166 416 V420 H213 L219 414",
  "M230 360 V224",
];

/** A through-hole pad: a ring with a hole. Pin 1 is square, as on a real board. */
function Pad({ x, y, first = false }: { x: number; y: number; first?: boolean }) {
  return (
    <>
      <rect
        x={x - 6.5}
        y={y - 6.5}
        width="13"
        height="13"
        rx={first ? 1 : 6.5}
        fill="var(--vc-sheet)"
        stroke="var(--vc-line)"
        strokeWidth="1.3"
      />
      <circle cx={x} cy={y} r="2.6" fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1" />
    </>
  );
}

/** Where a net drops through to the other side of the board. */
function Via({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="3.2" fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.4" />
      <circle cx={x} cy={y} r="1.1" fill="var(--vc-raised)" />
    </>
  );
}

/**
 * A part that is a door into an aisle.
 *
 * The hit rect is filled transparent rather than none: `none` takes no pointer
 * events at all, so a part drawn in outline would only be clickable on its own
 * strokes. The label rides inside the link so plain :hover reveals it without
 * needing to reach across the tree.
 */
function Part({
  href,
  aisle,
  hit,
  tip,
  children,
}: {
  href: string;
  aisle: string;
  hit: [number, number, number, number];
  tip: [number, number];
  children: React.ReactNode;
}) {
  const label = aisle.toUpperCase();
  const w = label.length * 6.1 + 13;
  return (
    <Link href={href} className="vc-part" aria-label={`Shop ${aisle.toLowerCase()}`}>
      <rect className="vc-hit" x={hit[0]} y={hit[1]} width={hit[2]} height={hit[3]} rx="4" />
      <g className="vc-part-body">{children}</g>
      <g className="vc-tip">
        <rect x={tip[0] - w / 2} y={tip[1] - 10.5} width={w} height="15" rx="3" fill="var(--vc-ink)" />
        <text
          x={tip[0]}
          y={tip[1]}
          textAnchor="middle"
          fill="var(--vc-ground)"
          fontFamily="var(--font-mono)"
          fontSize="8.6"
          letterSpacing="0.9"
        >
          {label}
        </text>
      </g>
    </Link>
  );
}

/* The four header groups, with the 0.16in break between D7 and D8 that every
   shield has had to live with since 2007. */
const DIGITAL_HI = Array.from({ length: 10 }, (_, i) => 376 + i * 20);
const DIGITAL_LO = Array.from({ length: 8 }, (_, i) => 204 + i * 20);
const POWER_HDR = Array.from({ length: 8 }, (_, i) => 170 + i * 20);
const ANALOG_HDR = Array.from({ length: 6 }, (_, i) => 356 + i * 20);
/** The DIP-28's legs, fourteen a side. */
const DIP_X = Array.from({ length: 14 }, (_, i) => 276 + i * 20);
/** The USB-serial chip's pads, a TQFP with five a side. */
const U2_X = [195, 204, 213, 222, 231];
const U2_Y = [119, 128, 137, 146, 155];
/** Both ICSP headers are 2x3. */
const ICSP = [516, 536, 556];
const ICSP2 = [140, 160, 180];
/** Where the header pins drop through. */
const DROP_HI = [516, 536, 556];
const MOUNT: [number, number][] = [
  [70, 285],
  [70, 452],
  [566, 100],
  [566, 425],
];

export function HeroFigure() {
  return (
    <div className="mx-auto w-full max-w-[420px]">
      <svg
        viewBox="0 0 650 520"
        className="vc-board w-full"
        role="group"
        aria-label="Arduino Uno board diagram — each part links to its aisle"
      >
        {/* registration ticks, as on a drawing sheet */}
        <g stroke="var(--vc-line)" strokeWidth="1.5" fill="none">
          <path d="M4 22V4h18M628 4h18v18M646 498v18h-18M22 516H4v-18" />
        </g>

        <defs>
          {/* the ground pour, hatched the way a board's copper fill is drawn.
              The tile's diagonal runs corner to corner past both edges so it
              joins up across cells instead of dashing. */}
          <pattern id="vc-pour" patternUnits="userSpaceOnUse" width="6" height="6">
            <path d="M-1 7L7-1" stroke="var(--vc-trace)" strokeWidth="0.85" fill="none" />
          </pattern>
          {/* Copper is held back from everything it must not touch, which is
              what stops a pour reading as wallpaper: a clearance gap follows
              every trace, rings every pad and via, and each mounting hole is
              kept clear. Masked in black — the pour is simply absent there. */}
          <mask id="vc-pour-keepout">
            <path d={BOARD_INSET} fill="#fff" />
            <g stroke="#000" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {[...SIGNAL, ...LIVE, ...POWER].map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <g fill="#000">
              {[...DIGITAL_HI, ...DIGITAL_LO].map((x) => (
                <circle key={`kt${x}`} cx={x} cy="66" r="10" />
              ))}
              {[...POWER_HDR, ...ANALOG_HDR].map((x) => (
                <circle key={`kb${x}`} cx={x} cy="444" r="10" />
              ))}
              {ICSP.map((x) => [224, 244].map((y) => (
                <circle key={`ki${x}-${y}`} cx={x} cy={y} r="10" />
              )))}
              {ICSP2.map((x) => [62, 80].map((y) => (
                <circle key={`kj${x}-${y}`} cx={x} cy={y} r="10" />
              )))}
              {MOUNT.map(([x, y]) => (
                <circle key={`km${x}-${y}`} cx={x} cy={y} r="18" />
              ))}
            </g>
          </mask>
        </defs>

        {/* the board, its pour, and the keepout line inside its edge */}
        <path d={BOARD} fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="2" />
        <path d={BOARD_INSET} fill="url(#vc-pour)" mask="url(#vc-pour-keepout)" opacity="0.38" />
        <path d={BOARD_INSET} fill="none" stroke="var(--vc-line-soft)" strokeWidth="1" />

        {/* ---------------------------------------------------------- traces */}
        <g fill="none" stroke="var(--vc-trace)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {SIGNAL.map((d) => <path key={d} d={d} />)}
        </g>
        <g fill="none" stroke="var(--vc-gold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {LIVE.map((d) => <path key={d} d={d} />)}
        </g>
        <g fill="none" stroke="var(--vc-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {POWER.map((d) => <path key={d} d={d} />)}
        </g>

        {/* current, running the live and power nets */}
        <g fill="none" stroke="var(--vc-spark)" strokeLinecap="round" strokeLinejoin="round">
          {LIVE.map((d, i) => (
            <path
              key={d}
              className="vc-pulse"
              d={d}
              strokeWidth="3"
              style={{ animationDelay: `${((i * 0.37) % 2.4).toFixed(2)}s` }}
            />
          ))}
          {POWER.map((d, i) => (
            <path
              key={d}
              className="vc-pulse"
              d={d}
              strokeWidth="3.8"
              style={{ animationDelay: `${(0.25 + i * 0.7).toFixed(2)}s` }}
            />
          ))}
        </g>

        {/* mounting holes */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.4">
          {MOUNT.map(([x, y]) => <circle key={`h${x}-${y}`} cx={x} cy={y} r="9" />)}
        </g>
        <g fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.1">
          {MOUNT.map(([x, y]) => <circle key={`hi${x}-${y}`} cx={x} cy={y} r="4" />)}
        </g>

        {/* the vias every net that continues on the back drops through */}
        {DIGITAL_LO.map((x) => <Via key={`vl${x}`} x={x} y={86} />)}
        {DROP_HI.map((x) => <Via key={`vh${x}`} x={x} y={86} />)}
        {ICSP.map((x) => <Via key={`vi${x}`} x={x} y={262} />)}
        {ICSP2.map((x) => <Via key={`vj${x}`} x={x} y={100} />)}
        {POWER_HDR.map((x) => <Via key={`vp${x}`} x={x} y={430} />)}
        <Via x={129} y={108} />
        <Via x={262} y={128} />
        <Via x={262} y={146} />
        <Via x={196} y={236} />

        {/* ------------------------------------------ passives, drawing only */}
        {/* the two electrolytics beside the power section */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6">
          <circle cx="182" cy="320" r="21" />
          <circle cx="182" cy="372" r="21" />
        </g>
        <g fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.2">
          <circle cx="182" cy="320" r="13" />
          <circle cx="182" cy="372" r="13" />
        </g>
        <g stroke="var(--vc-line)" strokeWidth="1.4" fill="none">
          <path d="M173 313a13 13 0 0 0 0 14" />
          <path d="M173 365a13 13 0 0 0 0 14" />
        </g>

        {/* the 0805s scattered over the open copper, as they are on the real
            board: two by the usb-serial chip, one by each header */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4">
          <rect x="286" y="136" width="16" height="10" rx="1.5" />
          <rect x="286" y="162" width="16" height="10" rx="1.5" />
          <rect x="320" y="136" width="16" height="10" rx="1.5" />
          <rect x="505" y="272" width="16" height="10" rx="1.5" />
        </g>
        <g fill="var(--vc-muted)">
          {[[286, 136], [286, 162], [320, 136], [505, 272]].map(([x, y]) => (
            <g key={`r${x}-${y}`}>
              <rect x={x} y={y} width="4.5" height="10" rx="1" />
              <rect x={x + 11.5} y={y} width="4.5" height="10" rx="1" />
            </g>
          ))}
        </g>

        {/* the 16MHz crystal, in its can, beside the processor */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5">
          <rect x="243" y="268" width="10" height="14" rx="1.5" />
          <rect x="345" y="268" width="10" height="14" rx="1.5" />
        </g>
        <rect x="258" y="258" width="87" height="34" rx="16"
              fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.7" />
        <rect x="265" y="264" width="73" height="22" rx="11"
              fill="none" stroke="var(--vc-line)" strokeWidth="1.1" />

        {/* the usb-serial chip: a TQFP, drawn but not a door — no aisle sells one */}
        <g fill="var(--vc-muted)">
          {U2_X.map((x) => (
            <rect key={`ut${x}`} x={x - 3} y="104" width="6" height="6" rx="1" />
          ))}
          {U2_X.map((x) => (
            <rect key={`ub${x}`} x={x - 3} y="165" width="6" height="6" rx="1" />
          ))}
          {U2_Y.map((y) => (
            <rect key={`ul${y}`} x="180" y={y - 3} width="6" height="6" rx="1" />
          ))}
          {U2_Y.map((y) => (
            <rect key={`ur${y}`} x="241" y={y - 3} width="6" height="6" rx="1" />
          ))}
        </g>
        <rect x="186" y="110" width="55" height="55" rx="3"
              fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
        <circle cx="194" cy="118" r="3" fill="none" stroke="var(--vc-line)" strokeWidth="1.2" />

        {/* ------------------------------------------- the parts, as doors */}
        <Part href="/shop/connectors" aisle="Connectors" hit={[196, 42, 368, 48]} tip={[380, 30]}>
          {DIGITAL_LO.map((x, i) => (
            <Pad key={`dl${x}`} x={x} y={66} first={i === 0} />
          ))}
          {DIGITAL_HI.map((x, i) => (
            <Pad key={`dh${x}`} x={x} y={66} first={i === 0} />
          ))}
        </Part>

        <Part href="/shop/connectors" aisle="Connectors" hit={[162, 422, 302, 46]} tip={[313, 480]}>
          {POWER_HDR.map((x, i) => (
            <Pad key={`ph${x}`} x={x} y={444} first={i === 0} />
          ))}
          {ANALOG_HDR.map((x, i) => (
            <Pad key={`ah${x}`} x={x} y={444} first={i === 0} />
          ))}
        </Part>

        <Part href="/shop/connectors" aisle="Connectors" hit={[38, 106, 126, 106]} tip={[101, 228]}>
          {/* USB-B: the shell, the mouth standing past the board's edge, and
              the tongue inside — a socket reads by its opening */}
          <g fill="var(--vc-muted)">
            {[128, 146].map((y) => (
              <rect key={`up${y}`} x="150" y={y - 5} width="12" height="10" rx="1" />
            ))}
          </g>
          <rect x="50" y="112" width="100" height="94" rx="3"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.7" />
          <path d="M62 112v94M138 112v94" stroke="var(--vc-line)" strokeWidth="1.1" fill="none" />
          <rect x="34" y="128" width="20" height="62" rx="3"
                fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.7" />
          <rect x="40" y="140" width="10" height="38" rx="2"
                fill="none" stroke="var(--vc-line)" strokeWidth="1.2" />
        </Part>

        <Part href="/shop/connectors" aisle="Connectors" hit={[128, 48, 62, 50]} tip={[159, 112]}>
          {ICSP2.map((x) =>
            [62, 80].map((y) => (
              <Pad key={`i2${x}-${y}`} x={x} y={y} first={x === 140 && y === 62} />
            )),
          )}
        </Part>

        <Part href="/shop/connectors" aisle="Connectors" hit={[506, 210, 62, 52]} tip={[537, 200]}>
          {ICSP.map((x) =>
            [224, 244].map((y) => (
              <Pad key={`i1${x}-${y}`} x={x} y={y} first={x === 516 && y === 224} />
            )),
          )}
        </Part>

        <Part href="/shop/power" aisle="Power" hit={[40, 350, 120, 88]} tip={[100, 460]}>
          {/* the barrel jack: housing, the barrel standing out of it past the
              board's edge, and the centre pin inside */}
          <g fill="var(--vc-muted)">
            {[374, 416].map((y) => (
              <rect key={`jp${y}`} x="154" y={y - 6} width="12" height="12" rx="1" />
            ))}
          </g>
          <rect x="56" y="359" width="98" height="71" rx="3"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.7" />
          <path d="M68 359v71" stroke="var(--vc-line)" strokeWidth="1.1" fill="none" />
          <rect x="36" y="374" width="24" height="42" rx="12"
                fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.7" />
          <circle cx="48" cy="395" r="6" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
        </Part>

        <Part href="/shop/power" aisle="Power" hit={[206, 356, 60, 62]} tip={[236, 344]}>
          {/* SOT-223: the wide tab on one side, three pins on the other */}
          <rect x="216" y="360" width="39" height="12" rx="1.5"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4" />
          <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4">
            <rect x="214" y="402" width="10" height="12" rx="1.5" />
            <rect x="232" y="402" width="10" height="12" rx="1.5" />
            <rect x="250" y="402" width="10" height="12" rx="1.5" />
          </g>
          <rect x="210" y="370" width="51" height="32" rx="2"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
          <path d="M210 379h51" stroke="var(--vc-line)" strokeWidth="1.1" fill="none" />
        </Part>

        <Part href="/shop/display" aisle="Display" hit={[178, 178, 68, 52]} tip={[212, 246]}>
          {/* TX and RX flickering against each other, L blinking, and ON lit */}
          <circle className="vc-led-halo" cx="228" cy="219" r="9" fill="var(--vc-gold)" />
          <g fill="var(--vc-muted)">
            {[188, 220].map((x) =>
              [182, 210].map((y) => (
                <g key={`lc${x}-${y}`}>
                  <rect x={x} y={y} width="16" height="5" rx="1" />
                  <rect x={x} y={y + 15} width="16" height="5" rx="1" />
                </g>
              )),
            )}
          </g>
          <rect className="vc-led-tx" x="188" y="186" width="16" height="10" rx="1.5"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.3" />
          <rect className="vc-led-rx" x="220" y="186" width="16" height="10" rx="1.5"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.3" />
          <rect className="vc-led-blink" x="188" y="214" width="16" height="10" rx="1.5"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.3" />
          <rect x="220" y="214" width="16" height="10" rx="1.5" fill="var(--vc-gold)" />
        </Part>

        <Part href="/shop/switches" aisle="Switches" hit={[70, 48, 56, 52]} tip={[98, 34]}>
          {/* four legs and a round actuator: a tactile switch is known by its
              legs, and without them this is just a square with a circle */}
          <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.3">
            <rect x="72" y="61" width="10" height="10" rx="1" />
            <rect x="72" y="86" width="10" height="10" rx="1" />
            <rect x="124" y="61" width="10" height="10" rx="1" />
            <rect x="124" y="86" width="10" height="10" rx="1" />
          </g>
          <rect x="80" y="56" width="46" height="46" rx="2"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
          <circle cx="103" cy="79" r="13" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.5" />
          <circle cx="103" cy="79" r="5" fill="none" stroke="var(--vc-line)" strokeWidth="1.2" />
        </Part>

        <Part href="/shop/microcontrollers" aisle="Microcontrollers" hit={[272, 292, 276, 100]} tip={[410, 410]}>
          {/* the socket the DIP sits in, then the DIP: legs both sides, the end
              notch, and the pin-1 dimple beside it */}
          <rect x="260" y="307" width="288" height="71" rx="3"
                fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.2" />
          <g fill="var(--vc-muted)">
            {DIP_X.map((x) => (
              <rect key={`pt${x}`} x={x - 4} y="301" width="8" height="12" rx="1" />
            ))}
            {DIP_X.map((x) => (
              <rect key={`pb${x}`} x={x - 4} y="372" width="8" height="12" rx="1" />
            ))}
          </g>
          <rect x="266" y="313" width="276" height="59" rx="3"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.7" />
          <path d="M266 332a10 10 0 0 0 0 20" fill="none" stroke="var(--vc-muted)" strokeWidth="1.4" />
          <circle cx="285" cy="326" r="4.5" fill="none" stroke="var(--vc-muted)" strokeWidth="1.4" />
        </Part>

        {/* a dimension line, because the sheet always carries one */}
        <g stroke="var(--vc-faint)" strokeWidth="1.1">
          <path d="M52 496h540M52 490v12M592 490v12" />
        </g>
      </svg>
    </div>
  );
}
