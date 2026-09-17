import Link from "next/link";

/**
 * The hero's figure: an ESP32 development board, drawn the way the rest of the
 * site is drawn — a plate on the drawing sheet, line work in ink, current in
 * gold.
 *
 * It is a replica rather than a generic board, so it is built to the real
 * thing's proportions: 25.4 x 51.4mm, which is the 200 x 408 the board is drawn
 * at here, at 7.87 units to the millimetre. Everything else follows from that
 * scale — 2.54mm header pitch is 20 units, the module's 1.27mm castellations
 * are 10, an 0805 passive is 16 x 10.
 *
 * What makes it read as an ESP32 at a glance is the silhouette, in this order:
 * the shield can with the meandered antenna overhanging the top edge, the two
 * long header rows down the sides, and the micro-USB flanked by EN and BOOT at
 * the bottom. That is why those four are drawn most carefully.
 *
 * The routing is done the way a board is routed:
 *
 *   - Pads are rings with a hole through them, and pin 1 of each header is
 *     square. The module's castellations run at half the header pitch, as they
 *     do on a WROOM.
 *   - Every trace leaves a pad straight, turns at 45 degrees and arrives
 *     square. No trace crosses another and none runs through a component body,
 *     because on this layer neither can happen. Where a net has to get past
 *     something — or, as on the real board, simply continues underneath the
 *     module — it ends on a via.
 *   - Power is drawn heavier than signal, as it is laid out heavier.
 *
 * The board is powered rather than posed: the power LED breathes, the GPIO2
 * LED blinks, the antenna radiates, and pulses of current run the live nets —
 * USB in to the bridge, the bridge's UART up to the module, the regulator's
 * 3V3 back out. It is CSS on SVG — no script, nothing to hydrate — and it
 * stops dead under prefers-reduced-motion, where the board falls back to the
 * drawing.
 *
 * And the parts are doors. Each one that maps honestly onto an aisle is a link
 * into it: the module to microcontrollers, the headers and usb to connectors,
 * the regulator to power, the LEDs to display, EN and BOOT to switches. A
 * DevKit carries no sensor and nothing that moves, so sensors and actuators
 * have no door here — the headline keeps its own Sensors link. The USB-UART
 * bridge is drawn but is not a door either: no aisle sells one.
 *
 * Because the drawing contains links it cannot be role="img": that role makes
 * everything inside it presentational and would hide every one of them from
 * assistive tech.
 */

/** Signal runs: the fine copper that carries no current in this drawing. */
const SIGNAL = [
  /* module castellations out to the header pins beside them */
  "M89.5 132 H99",
  "M89.5 152 H99",
  "M89.5 172 H99",
  "M89.5 192 H99",
  "M89.5 212 H99",
  "M89.5 252 H99",
  "M250.5 132 H241",
  "M250.5 152 H241",
  "M250.5 172 H241",
  "M250.5 192 H241",
  "M250.5 212 H241",
  "M250.5 232 H241",
  "M250.5 252 H241",
  /* the pins below the module drop through and run underneath it */
  "M89.5 272 H97",
  "M89.5 292 H97",
  "M89.5 312 H97",
  "M89.5 332 H97",
  "M89.5 352 H97",
  "M89.5 372 H97",
  "M89.5 392 H97",
  "M250.5 272 H243",
  "M250.5 292 H243",
  "M250.5 312 H243",
  "M250.5 332 H243",
  "M250.5 352 H243",
  "M250.5 372 H243",
  "M250.5 392 H243",
  /* the two buttons, straight down to a via */
  "M127 422 V414",
  "M234 422 V414",
  /* the LEDs' return to ground */
  "M192 292 V304",
  "M218 292 V304",
];

/** Live runs: the ones the pulses travel. */
const LIVE = [
  /* usb data, up to the bridge */
  "M162 420 V394",
  "M178 420 V394",
  /* the bridge's uart, up to the module */
  "M162 342 V271 L149 258",
  "M170 342 V265 L163 258",
  /* the two indicators */
  "M191 258 V272",
  "M205 258 V265 L212 272",
];

/** Power: 5V in off the usb, through the regulator, 3V3 back out. */
const POWER = [
  "M154 420 V408 L144 398 H113 V318",
  "M135 270 V258",
  "M89.5 232 H99",
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

/** 15 pins a side at 2.54mm, which is 20 units at this scale. */
const HEADER_Y = Array.from({ length: 15 }, (_, i) => 132 + i * 20);
/** The module's castellations, at half the header pitch as a WROOM's are. */
const CAST_Y = Array.from({ length: 13 }, (_, i) => 132 + i * 10);
/** Its bottom row, the six that face down the board. */
const CAST_BOT_X = [135, 149, 163, 177, 191, 205];
/** Where the lower pins drop through, down each margin. */
const DROP_Y = [272, 292, 312, 332, 352, 372, 392];
/** The bridge's pads, a QFN with five a side. */
const QFN_X = [154, 162, 170, 178, 186];
const QFN_Y = [354, 362, 370, 378, 386];

export function HeroFigure() {
  return (
    <div className="mx-auto w-full max-w-[286px]">
      <svg
        viewBox="0 0 340 540"
        className="vc-board w-full"
        role="group"
        aria-label="ESP32 board diagram — each part links to its aisle"
      >
        {/* registration ticks, as on a drawing sheet */}
        <g stroke="var(--vc-line)" strokeWidth="1.5" fill="none">
          <path d="M4 22V4h18M318 4h18v18M336 518v18h-18M22 536H4v-18" />
        </g>

        <defs>
          {/* the ground pour, hatched the way a board's copper fill is drawn.
              The tile's diagonal runs corner to corner past both edges so it
              joins up across cells instead of dashing. */}
          <pattern id="vc-pour" patternUnits="userSpaceOnUse" width="6" height="6">
            <path d="M-1 7L7-1" stroke="var(--vc-trace)" strokeWidth="0.85" fill="none" />
          </pattern>
          {/* the shield can is stamped metal: a regular grid of raised dimples,
              which is what a WROOM's lid actually looks like up close */}
          <pattern id="vc-can" patternUnits="userSpaceOnUse" width="10" height="10">
            <circle cx="5" cy="5" r="0.85" fill="var(--vc-line)" />
          </pattern>
          {/* Copper is held back from everything it must not touch, which is
              what stops a pour reading as wallpaper: a clearance gap follows
              every trace, rings every pad and rings every via. Masked in
              black — the pour is simply absent there. */}
          <mask id="vc-pour-keepout">
            <rect x="78" y="82" width="184" height="392" rx="4" fill="#fff" />
            <g stroke="#000" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {[...SIGNAL, ...LIVE, ...POWER].map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <g fill="#000">
              {HEADER_Y.map((y) => (
                <circle key={`ml${y}`} cx="83" cy={y} r="10" />
              ))}
              {HEADER_Y.map((y) => (
                <circle key={`mr${y}`} cx="257" cy={y} r="10" />
              ))}
              {DROP_Y.map((y) => (
                <circle key={`vl${y}`} cx="97" cy={y} r="6.5" />
              ))}
              {DROP_Y.map((y) => (
                <circle key={`vr${y}`} cx="243" cy={y} r="6.5" />
              ))}
            </g>
          </mask>
        </defs>

        {/* the antenna's field, leaving the board */}
        <g
          fill="none"
          stroke="var(--vc-gold)"
          strokeWidth="2.6"
          strokeLinecap="round"
          aria-hidden
        >
          {[0, 0.95, 1.9].map((delay) => (
            <path
              key={delay}
              className="vc-rf"
              d="M130.1 58.5A62 62 0 0 1 209.9 58.5"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </g>

        {/* the board, its pour, and the keepout line inside its edge */}
        <rect x="70" y="74" width="200" height="408" rx="5"
              fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="2" />
        <rect x="78" y="82" width="184" height="392" rx="4"
              fill="url(#vc-pour)" mask="url(#vc-pour-keepout)" opacity="0.38" />
        <rect x="75" y="79" width="190" height="398" rx="4"
              fill="none" stroke="var(--vc-line-soft)" strokeWidth="1" />

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
              style={{ animationDelay: `${((i * 0.41) % 2.4).toFixed(2)}s` }}
            />
          ))}
          {POWER.map((d, i) => (
            <path
              key={d}
              className="vc-pulse"
              d={d}
              strokeWidth="3.8"
              style={{ animationDelay: `${(0.2 + i * 0.5).toFixed(2)}s` }}
            />
          ))}
        </g>

        {/* the vias the lower pins and the buttons drop through */}
        {DROP_Y.map((y) => <Via key={`dl${y}`} x={97} y={y} />)}
        {DROP_Y.map((y) => <Via key={`dr${y}`} x={243} y={y} />)}
        <Via x={127} y={414} />
        <Via x={234} y={414} />
        <Via x={192} y={304} />
        <Via x={218} y={304} />

        {/* ------------------------------------------ passives, drawing only */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4">
          <rect x="122" y="330" width="18" height="12" rx="1.5" />
          <rect x="122" y="356" width="18" height="12" rx="1.5" />
          <rect x="214" y="340" width="18" height="12" rx="1.5" />
        </g>
        <g fill="var(--vc-muted)">
          <rect x="122" y="330" width="4.5" height="12" rx="1" />
          <rect x="135.5" y="330" width="4.5" height="12" rx="1" />
          <rect x="122" y="356" width="4.5" height="12" rx="1" />
          <rect x="135.5" y="356" width="4.5" height="12" rx="1" />
          <rect x="214" y="340" width="4.5" height="12" rx="1" />
          <rect x="227.5" y="340" width="4.5" height="12" rx="1" />
        </g>

        {/* the usb-uart bridge: a QFN, drawn but not a door — no aisle sells one */}
        <g fill="var(--vc-muted)">
          {QFN_X.map((x) => (
            <rect key={`qt${x}`} x={x - 3} y="342" width="6" height="6" rx="1" />
          ))}
          {QFN_X.map((x) => (
            <rect key={`qb${x}`} x={x - 3} y="388" width="6" height="6" rx="1" />
          ))}
          {QFN_Y.map((y) => (
            <rect key={`ql${y}`} x="144" y={y - 3} width="6" height="6" rx="1" />
          ))}
          {QFN_Y.map((y) => (
            <rect key={`qr${y}`} x="190" y={y - 3} width="6" height="6" rx="1" />
          ))}
        </g>
        <rect x="150" y="348" width="40" height="40" rx="3"
              fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
        <circle cx="157" cy="355" r="2.6" fill="none" stroke="var(--vc-line)" strokeWidth="1.2" />

        {/* ------------------------------------------- the parts, as doors */}
        <Part href="/shop/connectors" aisle="Connectors" hit={[60, 122, 31, 300]} tip={[60, 112]}>
          {HEADER_Y.map((y, i) => (
            <Pad key={`hl${y}`} x={83} y={y} first={i === 0} />
          ))}
        </Part>
        <Part href="/shop/connectors" aisle="Connectors" hit={[249, 122, 31, 300]} tip={[278, 112]}>
          {HEADER_Y.map((y, i) => (
            <Pad key={`hr${y}`} x={257} y={y} first={i === 0} />
          ))}
        </Part>

        <Part href="/shop/microcontrollers" aisle="Microcontrollers" hit={[96, 52, 148, 210]} tip={[170, 34]}>
          {/* the castellations, running out from under both long edges */}
          <g fill="var(--vc-muted)">
            {CAST_Y.map((y) => (
              <rect key={`cl${y}`} x="95" y={y - 2.6} width="8" height="5.2" rx="1" />
            ))}
            {CAST_Y.map((y) => (
              <rect key={`cr${y}`} x="237" y={y - 2.6} width="8" height="5.2" rx="1" />
            ))}
            {CAST_BOT_X.map((x) => (
              <rect key={`cb${x}`} x={x - 2.6} y="254" width="5.2" height="8" rx="1" />
            ))}
          </g>
          {/* the antenna's own board, kept clear of copper, and its meander */}
          <rect x="99" y="58" width="142" height="48" rx="2"
                fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.5" />
          <path
            d={
              "M113 98 V72 H123 V96 H133 V72 H143 V96 H153 V72 H163 V96 " +
              "H173 V72 H183 V96 H193 V72 H203 V96 H213 V72 H223 V107"
            }
            fill="none"
            stroke="var(--vc-gold)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* the shield can, with the spot welds down its seam */}
          <rect x="99" y="106" width="142" height="152" rx="3"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.8" />
          <rect x="105" y="112" width="130" height="140" rx="2"
                fill="url(#vc-can)" stroke="var(--vc-line)" strokeWidth="1.1" opacity="0.6" />
          <path d="M105 119h130" stroke="var(--vc-line-soft)" strokeWidth="1" fill="none" />
          <g fill="var(--vc-line)">
            {[120, 148, 176, 204, 232].map((x) => (
              <circle key={`wt${x}`} cx={x} cy="109.5" r="1.5" />
            ))}
            {[120, 148, 176, 204, 232].map((x) => (
              <circle key={`wb${x}`} cx={x} cy="254.5" r="1.5" />
            ))}
            {[130, 160, 190, 220].map((y) => (
              <circle key={`wl${y}`} cx="101.5" cy={y} r="1.5" />
            ))}
            {[130, 160, 190, 220].map((y) => (
              <circle key={`wr${y}`} cx="238.5" cy={y} r="1.5" />
            ))}
          </g>
        </Part>

        <Part href="/shop/power" aisle="Power" hit={[100, 264, 60, 60]} tip={[130, 336]}>
          {/* SOT-223: the wide tab on one side, three pins on the other */}
          <rect x="110" y="270" width="39" height="12" rx="1.5"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4" />
          <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4">
            <rect x="108" y="306" width="10" height="12" rx="1.5" />
            <rect x="126" y="306" width="10" height="12" rx="1.5" />
            <rect x="144" y="306" width="10" height="12" rx="1.5" />
          </g>
          <rect x="104" y="280" width="51" height="28" rx="2"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
          <path d="M104 288h51" stroke="var(--vc-line)" strokeWidth="1.1" fill="none" />
        </Part>

        <Part href="/shop/display" aisle="Display" hit={[180, 266, 50, 46]} tip={[205, 324]}>
          {/* power, breathing — and GPIO2, blinking as a fresh board's does */}
          <circle className="vc-led-halo" cx="192" cy="282" r="6.5" fill="var(--vc-gold)" />
          <g fill="var(--vc-muted)">
            <rect x="186" y="272" width="12" height="5" rx="1" />
            <rect x="186" y="287" width="12" height="5" rx="1" />
            <rect x="212" y="272" width="12" height="5" rx="1" />
            <rect x="212" y="287" width="12" height="5" rx="1" />
          </g>
          <rect x="186" y="276" width="12" height="12" rx="1.5" fill="var(--vc-gold)" />
          <rect className="vc-led-blink" x="212" y="276" width="12" height="12" rx="1.5"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.3" />
        </Part>

        <Part href="/shop/switches" aisle="Switches" hit={[93, 422, 45, 56]} tip={[104, 490]}>
          <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.3">
            <rect x="100" y="422" width="12" height="7" rx="1" />
            <rect x="121" y="422" width="12" height="7" rx="1" />
            <rect x="100" y="470" width="12" height="7" rx="1" />
            <rect x="121" y="470" width="12" height="7" rx="1" />
          </g>
          <rect x="96" y="428" width="41" height="42" rx="2"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
          <circle cx="116.5" cy="449" r="11" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.5" />
          <circle cx="116.5" cy="449" r="4.5" fill="none" stroke="var(--vc-line)" strokeWidth="1.2" />
        </Part>

        <Part href="/shop/switches" aisle="Switches" hit={[202, 422, 45, 56]} tip={[236, 490]}>
          <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.3">
            <rect x="207" y="422" width="12" height="7" rx="1" />
            <rect x="228" y="422" width="12" height="7" rx="1" />
            <rect x="207" y="470" width="12" height="7" rx="1" />
            <rect x="228" y="470" width="12" height="7" rx="1" />
          </g>
          <rect x="203" y="428" width="41" height="42" rx="2"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
          <circle cx="223.5" cy="449" r="11" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.5" />
          <circle cx="223.5" cy="449" r="4.5" fill="none" stroke="var(--vc-line)" strokeWidth="1.2" />
        </Part>

        <Part href="/shop/connectors" aisle="Connectors" hit={[140, 414, 60, 84]} tip={[170, 512]}>
          {/* micro-usb: the five pins on the board, the shell over them, and
              the mouth standing past the board's edge with the tongue inside */}
          <g fill="var(--vc-muted)">
            {QFN_X.map((x) => (
              <rect key={`up${x}`} x={x - 3} y="420" width="6" height="10" rx="1" />
            ))}
          </g>
          <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4">
            <rect x="141" y="420" width="11" height="12" rx="1.5" />
            <rect x="188" y="420" width="11" height="12" rx="1.5" />
          </g>
          <rect x="141" y="430" width="58" height="50" rx="2"
                fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
          <path d="M141 440h58" stroke="var(--vc-line)" strokeWidth="1.1" fill="none" />
          <rect x="152" y="472" width="36" height="16" rx="5"
                fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.6" />
          <rect x="158" y="477" width="24" height="7" rx="2"
                fill="none" stroke="var(--vc-line)" strokeWidth="1.2" />
        </Part>

        {/* a dimension line, because the sheet always carries one */}
        <g stroke="var(--vc-faint)" strokeWidth="1.1">
          <path d="M70 524h200M70 518v12M270 518v12" />
        </g>
      </svg>
    </div>
  );
}
