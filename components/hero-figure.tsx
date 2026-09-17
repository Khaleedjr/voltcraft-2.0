import Link from "next/link";

/**
 * The hero's figure: a control board, drawn in isometric.
 *
 * The routing is still laid out in plan — the arrays below are ordinary
 * top-down coordinates — and the whole board plane is projected by one
 * matrix. That matters: every check that proved this layout sound (no trace
 * crossing another, none through a component body, every bend at 45 degrees,
 * no label on a wire, clearance in the pour) runs against those same plan
 * coordinates and still holds. Projecting at render time rather than baking
 * the isometry into the data is what keeps the drawing verifiable.
 *
 *   iso(x, y, z) = ( (x - y)·cos30 + OX , (x + y)/2 - z + OY )
 *
 * so +x runs down-right, +y runs down-left and +z is straight up the screen.
 * Because z only moves a point up, anything lying flat at a height is just the
 * plane matrix with a translate on top of it — which is how the chip's
 * markings, the sensor's grille and the fan's blades ride on their parts.
 * The fan still spins in plan and is projected after, so it turns in the
 * board's plane rather than the screen's.
 *
 * A circle in the plane projects to an axis-aligned ellipse of exactly
 * rx = r·cos30·√2, ry = r·√2/2, which is why the electrolytics and the LEDs
 * are cylinders rather than an approximation.
 *
 * The parts are still doors: each one that maps honestly onto an aisle links
 * into it, and names the aisle in plain words on hover. There are no component
 * designators — those are notation for whoever assembles a board, not for
 * whoever is shopping for one. The header pin names stay, printed on the board
 * and so sheared with it, as silkscreen would be.
 */

/* ------------------------------------------------------------- projection */
const K = 0.8660254;
const OX = 344;
const OY = 11;
/** The board plane itself: plan coordinates in, isometric out. */
const PLANE = `matrix(${K} 0.5 -${K} 0.5 ${OX} ${OY})`;
/** Anything lying flat at a height is the plane, lifted. */
const at = (z: number) => `translate(0 ${-z}) ${PLANE}`;

const px = (x: number, y: number) => (x - y) * K + OX;
const py = (x: number, y: number, z = 0) => (x + y) / 2 - z + OY;
const pt = (x: number, y: number, z = 0) => `${px(x, y).toFixed(1)},${py(x, y, z).toFixed(1)}`;
/** A plan rectangle's top face, as screen-space points. */
const face = (x: number, y: number, w: number, h: number, z: number) =>
  `${pt(x, y, z)} ${pt(x + w, y, z)} ${pt(x + w, y + h, z)} ${pt(x, y + h, z)}`;

/* ------------------------------------------------------------------ nets */
/** Signal runs: the fine copper that carries no current in this drawing. */
const SIGNAL = [
  "M217 160 V137.5 L156.5 77",
  "M230 160 V128.5 L178.5 77",
  "M256 160 V109.5 L288.5 77",
  "M269 160 V118.5 L310.5 77",
  "M282 160 V127.5 L332.5 77",
  "M295 160 V136.5 L354.5 77",
  "M192 188 H176",
  "M192 200 H188 L182 194",
  "M192 212 H180 L174 206",
  "M192 224 H184 L178 230",
  "M192 236 H186 L180 242",
  "M192 248 H174 V276 L168 282 H162",
  "M94 206 H80 V270 L86 276 H62",
  "M156 224 V262 L150 268",
  "M320 188 H332",
  "M320 200 H328",
  "M320 212 H330",
  "M320 224 H322 L330 232",
  "M320 236 H324 L330 242",
  "M320 260 H324 L330 266",
  "M217 276 V328.5 L244.5 356",
  "M230 276 V319.5 L266.5 356",
  "M243 276 V310.5 L288.5 356",
  "M256 276 V301.5 L310.5 356",
  "M269 276 V292.5 L332.5 356",
  "M295 276 V292 L307 304 H388",
];

/** Live runs: the ones the pulses travel. */
const LIVE = [
  "M204 160 V146.5 L134.5 77",
  "M243 160 V100.5 L266.5 77",
  "M308 160 V145.5 L376.5 77",
  "M192 176 H108 L101 169 H62",
  "M320 176 H370 L404 142 V128",
  "M320 248 H322 L330 256",
  "M308 276 V282 L314 288 H388",
  "M192 260 H186 V341.5 L200.5 356",
  "M204 276 V337.5 L222.5 356",
  "M282 276 V283.5 L354.5 356",
];

/** Power: jack in, through the regulator, out to the header's supply pins. */
const POWER = [
  "M62 292 H96",
  "M114 324 V335.5 L134.5 356",
  "M133 324 V332.5 L156.5 356",
  "M152 324 V329.5 L178.5 356",
];

const HEADER_X = Array.from({ length: 13 }, (_, i) => 128 + i * 22);
const CHIP_TOP_X = Array.from({ length: 9 }, (_, i) => 202 + i * 13);
const CHIP_SIDE_Y = Array.from({ length: 8 }, (_, i) => 174 + i * 12);
const STITCH_LEFT = [110, 136, 162, 188, 214, 240];
const STITCH_RIGHT = [110, 136, 162, 188, 214, 240, 266, 292, 318, 344];
const PIN_LABELS: [number, number, string][] = [
  [134.5, 380, "GND"],
  [156.5, 380, "5V"],
  [178.5, 380, "3V3"],
  [354.5, 61, "D11"],
  [376.5, 61, "D12"],
  [398.5, 61, "D13"],
];
const BLADES = [0, 72, 144, 216, 288];

/* ------------------------------------------------------------------ solids */
/**
 * A part standing on the board. Only the two faces a viewer can see are
 * drawn — the ones at max x and max y — each shaded so the form reads without
 * needing a light source: the top plain, the right a little down, the front
 * further. The shade is the palette's own shadow token, so it works in either
 * theme.
 */
function Box({
  x,
  y,
  w,
  h,
  z,
  fill = "var(--vc-sheet)",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  fill?: string;
}) {
  const x1 = x + w;
  const y1 = y + h;
  const right = `${pt(x1, y, z)} ${pt(x1, y1, z)} ${pt(x1, y1)} ${pt(x1, y)}`;
  const front = `${pt(x, y1, z)} ${pt(x1, y1, z)} ${pt(x1, y1)} ${pt(x, y1)}`;
  return (
    <>
      <polygon points={right} fill={fill} stroke="var(--vc-muted)" strokeWidth="1.2" />
      <polygon points={right} fill="rgba(var(--vc-shadow), 0.07)" />
      <polygon points={front} fill={fill} stroke="var(--vc-muted)" strokeWidth="1.2" />
      <polygon points={front} fill="rgba(var(--vc-shadow), 0.15)" />
      <polygon points={face(x, y, w, h, z)} fill={fill} stroke="var(--vc-muted)" strokeWidth="1.4" />
    </>
  );
}

/** A can standing on the board — an electrolytic, an indicator, the fan hub. */
function Cyl({
  cx,
  cy,
  r,
  z,
  fill = "var(--vc-sheet)",
  top = "var(--vc-raised)",
}: {
  cx: number;
  cy: number;
  r: number;
  z: number;
  fill?: string;
  top?: string;
}) {
  const sx = px(cx, cy);
  const sy = py(cx, cy);
  const rx = r * K * Math.SQRT2;
  const ry = (r * Math.SQRT2) / 2;
  const side = `M${sx - rx} ${sy - z} L${sx - rx} ${sy} A${rx} ${ry} 0 0 0 ${sx + rx} ${sy} L${sx + rx} ${sy - z} Z`;
  return (
    <>
      <path d={side} fill={fill} stroke="var(--vc-muted)" strokeWidth="1.2" />
      <path d={side} fill="rgba(var(--vc-shadow), 0.12)" stroke="none" />
      <ellipse cx={sx} cy={sy - z} rx={rx} ry={ry} fill={top} stroke="var(--vc-muted)" strokeWidth="1.3" />
    </>
  );
}

/**
 * A part that is a door into an aisle. The hit area is the part's own top face
 * projected, not a screen rectangle — an isometric part is a parallelogram and
 * a box around it would swallow its neighbours. The label rides in screen
 * space so it stays upright while everything under it lies back.
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
  hit: [number, number, number, number, number];
  tip: [number, number];
  children: React.ReactNode;
}) {
  const label = aisle.toUpperCase();
  const w = label.length * 6.7 + 14;
  const [hx, hy, hw, hh, hz] = hit;
  return (
    <Link href={href} className="vc-part" aria-label={`Shop ${aisle.toLowerCase()}`}>
      <polygon className="vc-hit" points={face(hx, hy, hw, hh, hz)} />
      <g className="vc-part-body">{children}</g>
      <g className="vc-tip">
        <rect x={tip[0] - w / 2} y={tip[1] - 11.5} width={w} height="16" rx="3" fill="var(--vc-ink)" />
        <text
          x={tip[0]}
          y={tip[1]}
          textAnchor="middle"
          fill="var(--vc-ground)"
          fontFamily="var(--font-mono)"
          fontSize="9.5"
          letterSpacing="1"
        >
          {label}
        </text>
      </g>
    </Link>
  );
}

const BOARD = { x: 44, y: 44, w: 432, h: 352 };
const THICK = 9;

export function HeroFigure() {
  const b = BOARD;
  const x1 = b.x + b.w;
  const y1 = b.y + b.h;
  return (
    <div className="mx-auto w-full max-w-[520px]">
      <svg
        viewBox="0 0 729 470"
        className="vc-board w-full"
        role="group"
        aria-label="Board diagram — each part links to its aisle"
      >
        <defs>
          {/* the ground pour, hatched the way a board's copper fill is drawn */}
          {/* A hatch runs at 45 degrees in plan, and 45 degrees in plan
              projects to dead horizontal — the one direction nothing else on
              an isometric board runs. Plan slope 1:3 comes out at 49 degrees
              on screen, and the 21x7 tile keeps the same line spacing. */}
          <pattern id="vc-pour" patternUnits="userSpaceOnUse" width="21" height="7">
            <path d="M-1 -0.333L22 7.333" stroke="var(--vc-trace)" strokeWidth="0.9" fill="none" />
          </pattern>
          {/* copper is held back from everything it must not touch: a clearance
              gap follows every trace, rings every pad, and each mounting hole
              is kept clear */}
          <mask id="vc-pour-keepout">
            <rect x="58" y="58" width="404" height="324" rx="8" fill="#fff" />
            <g stroke="#000" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {[...SIGNAL, ...LIVE, ...POWER].map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <g fill="#000">
              {HEADER_X.map((x) => (
                <circle key={`mt${x}`} cx={x + 6.5} cy="70.5" r="11" />
              ))}
              {HEADER_X.map((x) => (
                <circle key={`mb${x}`} cx={x + 6.5} cy="362.5" r="11" />
              ))}
              <circle cx="74" cy="74" r="17" />
              <circle cx="446" cy="74" r="17" />
              <circle cx="74" cy="366" r="17" />
              <circle cx="446" cy="366" r="17" />
            </g>
          </mask>
        </defs>

        {/* ---------------------------------------------- the board's own edge */}
        <polygon
          points={`${pt(x1, b.y)} ${pt(x1, y1)} ${pt(x1, y1, -THICK)} ${pt(x1, b.y, -THICK)}`}
          fill="var(--vc-raised)"
          stroke="var(--vc-muted)"
          strokeWidth="1.6"
        />
        <polygon
          points={`${pt(x1, b.y)} ${pt(x1, y1)} ${pt(x1, y1, -THICK)} ${pt(x1, b.y, -THICK)}`}
          fill="rgba(var(--vc-shadow), 0.1)"
        />
        <polygon
          points={`${pt(b.x, y1)} ${pt(x1, y1)} ${pt(x1, y1, -THICK)} ${pt(b.x, y1, -THICK)}`}
          fill="var(--vc-raised)"
          stroke="var(--vc-muted)"
          strokeWidth="1.6"
        />
        <polygon
          points={`${pt(b.x, y1)} ${pt(x1, y1)} ${pt(x1, y1, -THICK)} ${pt(b.x, y1, -THICK)}`}
          fill="rgba(var(--vc-shadow), 0.18)"
        />

        {/* ------------------------------- everything lying flat on the board */}
        <g transform={PLANE}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx="11"
            fill="var(--vc-raised)"
            stroke="var(--vc-muted)"
            strokeWidth="2.2"
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x="58"
            y="58"
            width="404"
            height="324"
            rx="8"
            fill="url(#vc-pour)"
            mask="url(#vc-pour-keepout)"
            opacity="0.38"
          />
          <rect
            x="51"
            y="51"
            width="418"
            height="338"
            rx="8"
            fill="none"
            stroke="var(--vc-line-soft)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          <g
            fill="none"
            stroke="var(--vc-trace)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            {SIGNAL.map((d) => (
              <path key={d} d={d} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          <g fill="none" stroke="var(--vc-gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {LIVE.map((d) => (
              <path key={d} d={d} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          <g fill="none" stroke="var(--vc-gold)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            {POWER.map((d) => (
              <path key={d} d={d} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          <g fill="none" stroke="var(--vc-spark)" strokeLinecap="round" strokeLinejoin="round">
            {LIVE.map((d, i) => (
              <path
                key={d}
                className="vc-pulse"
                d={d}
                strokeWidth="3.2"
                vectorEffect="non-scaling-stroke"
                style={{ animationDelay: `${((i * 0.53) % 2.4).toFixed(2)}s` }}
              />
            ))}
            {POWER.map((d, i) => (
              <path
                key={d}
                className="vc-pulse"
                d={d}
                strokeWidth="4.2"
                vectorEffect="non-scaling-stroke"
                style={{ animationDelay: `${(0.35 + i * 0.44).toFixed(2)}s` }}
              />
            ))}
          </g>

          {/* mounting holes, vias, and the pins that say what they are */}
          <g fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
            <circle cx="74" cy="74" r="8" />
            <circle cx="446" cy="74" r="8" />
            <circle cx="74" cy="366" r="8" />
            <circle cx="446" cy="366" r="8" />
          </g>
          <g fill="var(--vc-ground)" stroke="var(--vc-line)" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
            <circle cx="74" cy="74" r="3.5" />
            <circle cx="446" cy="74" r="3.5" />
            <circle cx="74" cy="366" r="3.5" />
            <circle cx="446" cy="366" r="3.5" />
          </g>
          <g fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
            <circle cx="176" cy="188" r="3.6" />
            <circle cx="182" cy="194" r="3.6" />
            <circle cx="178" cy="230" r="3.6" />
            <circle cx="180" cy="242" r="3.6" />
            <circle cx="332" cy="188" r="3.6" />
            <circle cx="330" cy="212" r="3.6" />
            {STITCH_LEFT.map((y) => (
              <circle key={`sl${y}`} cx="68" cy={y} r="2.7" />
            ))}
            {STITCH_RIGHT.map((y) => (
              <circle key={`sr${y}`} cx="458" cy={y} r="2.7" />
            ))}
          </g>
          <g fill="var(--vc-faint)" fontFamily="var(--font-mono)" fontSize="8.5" textAnchor="middle">
            {PIN_LABELS.map(([x, y, t]) => (
              <text key={t} x={x} y={y}>
                {t}
              </text>
            ))}
          </g>
        </g>

        {/* ------------------------------ the parts, back to front, as doors */}
        <Part href="/shop/connectors" aisle="Connectors" hit={[8, 138, 54, 62, 14]} tip={[px(41, 170) - 96, py(41, 170, 14) - 16]}>
          <Box x={20} y={144} w={42} h={52} z={14} />
          <Box x={12} y={157} w={14} h={26} z={9} fill="var(--vc-raised)" />
        </Part>

        <Part href="/shop/display" aisle="Display" hit={[62, 98, 50, 68, 8]} tip={[px(86, 132) - 66, py(86, 132, 8) - 20]}>
          <Cyl cx={86} cy={118} r={7} z={8} top="var(--vc-gold)" />
          <ellipse
            className="vc-led-halo"
            cx={px(86, 118)}
            cy={py(86, 118, 8)}
            rx={7 * K * Math.SQRT2}
            ry={(7 * Math.SQRT2) / 2}
            fill="var(--vc-gold)"
          />
          <Cyl cx={86} cy={146} r={7} z={8} />
          <ellipse
            className="vc-led-blink"
            cx={px(86, 146)}
            cy={py(86, 146, 8)}
            rx={7 * K * Math.SQRT2}
            ry={(7 * Math.SQRT2) / 2}
            fill="var(--vc-sheet)"
            stroke="var(--vc-muted)"
            strokeWidth="1.3"
          />
        </Part>

        <Part href="/shop/switches" aisle="Switches" hit={[112, 102, 54, 59, 12]} tip={[px(132, 122), py(132, 122, 12) - 34]}>
          <g transform={PLANE} fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4">
            <rect x="108" y="110" width="7" height="6" rx="1" vectorEffect="non-scaling-stroke" />
            <rect x="108" y="128" width="7" height="6" rx="1" vectorEffect="non-scaling-stroke" />
            <rect x="149" y="110" width="7" height="6" rx="1" vectorEffect="non-scaling-stroke" />
            <rect x="149" y="128" width="7" height="6" rx="1" vectorEffect="non-scaling-stroke" />
          </g>
          <Box x={114} y={104} w={36} h={36} z={12} />
          <Cyl cx={132} cy={122} r={10} z={17} top="var(--vc-raised)" />
        </Part>

        {/* the electrolytics, the small ceramic, and the jack */}
        <Cyl cx={112} cy={206} r={18} z={26} />
        <Box x={168} y={140} w={13} h={26} z={10} />
        <Part href="/shop/power" aisle="Power" hit={[8, 258, 82, 68, 18]} tip={[px(36, 292) - 92, py(36, 292, 18) + 6]}>
          <Box x={24} y={268} w={38} h={48} z={18} />
          <Box x={10} y={280} w={17} h={24} z={12} fill="var(--vc-raised)" />
          <g transform={at(12)}>
            <circle cx="18" cy="292" r="4" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          </g>
        </Part>
        <Cyl cx={156} cy={206} r={18} z={26} />

        <Part href="/shop/connectors" aisle="Connectors" hit={[126, 52, 291, 50, 0]} tip={[px(266, 62) - 10, py(266, 62) - 26]}>
          <g transform={PLANE}>
            {HEADER_X.map((x, i) => (
              <g key={`t${x}`}>
                <rect
                  x={x}
                  y="64"
                  width="13"
                  height="13"
                  rx={i === 0 ? 1 : 6.5}
                  fill="var(--vc-sheet)"
                  stroke="var(--vc-line)"
                  strokeWidth="1.3"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={x + 6.5} cy="70.5" r="2.6" fill="var(--vc-ground)" vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </g>
        </Part>

        <Part href="/shop/power" aisle="Power" hit={[96, 266, 66, 50, 20]} tip={[px(129, 291) - 74, py(129, 291, 20) + 4]}>
          <g transform={PLANE} stroke="var(--vc-muted)" strokeWidth="2.2" fill="none">
            <path d="M114 314v10M133 314v10M152 314v10" vectorEffect="non-scaling-stroke" />
          </g>
          <Box x={96} y={268} w={66} h={46} z={20} />
          <g transform={at(20)}>
            <path d="M96 280h66" stroke="var(--vc-line)" strokeWidth="1.4" fill="none" vectorEffect="non-scaling-stroke" />
          </g>
        </Part>

        <Part
          href="/shop/microcontrollers"
          aisle="Microcontrollers"
          hit={[198, 166, 116, 104, 10]}
          tip={[px(256, 218), py(256, 218, 10) - 40]}
        >
          <g transform={PLANE} fill="var(--vc-muted)">
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
          <Box x={200} y={168} w={112} h={100} z={10} />
          <g transform={at(10)} fill="none" stroke="var(--vc-muted)" strokeWidth="1.4">
            <path d="M244 168a12 12 0 0 0 24 0" vectorEffect="non-scaling-stroke" />
            <circle cx="213" cy="181" r="4.5" vectorEffect="non-scaling-stroke" />
          </g>
        </Part>

        <Part href="/shop/accessories" aisle="Accessories" hit={[392, 104, 64, 52, 6]} tip={[px(424, 119) + 78, py(424, 119, 6) - 16]}>
          <Box x={396} y={110} w={56} h={18} z={6} />
          <g transform={at(6)} stroke="var(--vc-line)" strokeWidth="1.4" fill="none">
            <path d="M410 110v18M422 110v18M434 110v18" vectorEffect="non-scaling-stroke" />
          </g>
        </Part>

        {/* the crystal, and its pads */}
        <g transform={PLANE} fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6">
          <rect x="328" y="193" width="8" height="14" rx="1.5" vectorEffect="non-scaling-stroke" />
          <rect x="388" y="193" width="8" height="14" rx="1.5" vectorEffect="non-scaling-stroke" />
        </g>
        <Box x={336} y={186} w={52} h={26} z={11} />
        <g transform={at(11)}>
          <rect
            x="342"
            y="191"
            width="40"
            height="16"
            rx="8"
            fill="none"
            stroke="var(--vc-line)"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        </g>

        <Part href="/shop/sensors" aisle="Sensors" hit={[334, 224, 50, 64, 18]} tip={[px(359, 256) + 82, py(359, 256, 18) + 2]}>
          <g transform={PLANE} fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4">
            {[230, 240, 254, 264].map((y) => (
              <rect key={y} x="330" y={y} width="6" height="4" rx="1" vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          <Box x={336} y={226} w={46} h={60} z={18} />
          <g transform={at(18)}>
            <g fill="var(--vc-raised)" stroke="var(--vc-line)" strokeWidth="1.2">
              {[344, 353, 362, 371].map((x) => (
                <rect key={x} x={x} y="238" width="5" height="32" rx="2.5" vectorEffect="non-scaling-stroke" />
              ))}
            </g>
            <path d="M336 278h46" stroke="var(--vc-line)" strokeWidth="1.3" fill="none" vectorEffect="non-scaling-stroke" />
          </g>
        </Part>

        <Part href="/shop/connectors" aisle="Connectors" hit={[126, 340, 291, 50, 0]} tip={[px(266, 380) - 4, py(266, 380) + 26]}>
          <g transform={PLANE}>
            {HEADER_X.map((x, i) => (
              <g key={`b${x}`}>
                <rect
                  x={x}
                  y="356"
                  width="13"
                  height="13"
                  rx={i === 0 ? 1 : 6.5}
                  fill="var(--vc-sheet)"
                  stroke="var(--vc-line)"
                  strokeWidth="1.3"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={x + 6.5} cy="362.5" r="2.6" fill="var(--vc-ground)" vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </g>
        </Part>

        <Part href="/shop/actuators" aisle="Actuators" hit={[388, 256, 60, 64, 16]} tip={[px(418, 288) + 74, py(418, 288, 16) + 18]}>
          <Box x={388} y={258} w={60} h={60} z={16} />
          <g transform={at(16)}>
            <g fill="none" stroke="var(--vc-line)" strokeWidth="1.3" vectorEffect="non-scaling-stroke">
              <circle cx="395" cy="265" r="3.2" />
              <circle cx="441" cy="265" r="3.2" />
              <circle cx="395" cy="311" r="3.2" />
              <circle cx="441" cy="311" r="3.2" />
            </g>
            <circle
              cx="418"
              cy="288"
              r="26"
              fill="var(--vc-raised)"
              stroke="var(--vc-line)"
              strokeWidth="1.3"
              vectorEffect="non-scaling-stroke"
            />
            {/* the blades turn in the board's plane, and are projected after */}
            <g transform="translate(418 288)">
              <g className="vc-fan">
                {BLADES.map((a) => (
                  <g key={a} transform={`rotate(${a})`}>
                    <ellipse
                      cx="0"
                      cy="-16"
                      rx="6.4"
                      ry="10.5"
                      transform="rotate(24 0 -16)"
                      fill="var(--vc-sheet)"
                      stroke="var(--vc-muted)"
                      strokeWidth="1.4"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                ))}
              </g>
            </g>
          </g>
          <Cyl cx={418} cy={288} r={7} z={20} top="var(--vc-sheet)" />
        </Part>
      </svg>
    </div>
  );
}
