import { SITE } from "@/lib/site";
import "./hero-workshop.css";

/**
 * The hero's figure: an enclosed 3D printer of the kind Bambu Lab made the
 * standard (a dark cube, a glass door, a filament box on top), carrying the
 * VoltCraft name, printing a robot on a 12s loop:
 *
 *   1. The print. As on the real machines, the toolhead stays up at the top
 *      and the bed drops a layer at a time; the head races across each layer,
 *      as wide as the robot is at that height, and the layer just laid glows.
 *   2. The head parks, the bed lowers, the door swings open.
 *   3. The robot wakes, eyes then antenna, steps toward us, hops down out of
 *      the machine, walks off and waves.
 *   4. The door shuts, the bed comes back up, the next print starts.
 *
 * Everything runs on one clock (hero-workshop.css), so nothing can drift. It
 * is CSS on SVG: no script, nothing to hydrate. Under prefers-reduced-motion it
 * holds the finished robot on the bed, awake, behind the closed door.
 *
 * The drawing is a front view with the depth drawn obliquely (up and to the
 * right), so the cube reads as a cube. The robot is drawn once about its own
 * origin (feet at 0, centre at 0) and placed by a transform attribute; CSS
 * transforms go on wrappers that carry none, because a CSS transform replaces
 * an element's transform attribute rather than composing with it.
 *
 * The printer is a link to the print service, so the drawing is role="group",
 * not role="img", which would hide the link from assistive tech.
 */

/** The nozzle's height: the robot's feet, and the layer being printed, are here. */
const NOZ = 262;
/** The middle of the bed, where the robot stands. */
const RX = 249;
/** The robot is drawn at this scale. */
const S = 0.72;
/** The bed's front edge, at the start of the print. */
const PLATE = NOZ + 9;

/**
 * The robot's silhouette about its own origin: clips its layer lines and its
 * glow. The arm it waves with is left out of the one for the layer lines,
 * which the arm carries itself, so the lines go with it.
 */
function RobotSilhouette({ waveArm = true }: { waveArm?: boolean }) {
  return (
    <>
      <circle cx="0" cy="-152" r="6" />
      <rect x="-2" y="-147" width="4" height="14" />
      <rect x="-38" y="-134" width="76" height="52" rx="10" />
      <rect x="-44" y="-117" width="7" height="18" rx="2" />
      <rect x="37" y="-117" width="7" height="18" rx="2" />
      <rect x="-12" y="-82" width="24" height="8" />
      <rect x="-50" y="-75" width="100" height="58" rx="8" />
      <rect x="-66" y="-70" width="16" height="40" rx="8" />
      {waveArm ? <rect x="50" y="-70" width="16" height="40" rx="8" /> : null}
      <rect x="-30" y="-18" width="18" height="13" />
      <rect x="12" y="-18" width="18" height="13" />
      <rect x="-35" y="-6" width="28" height="6" rx="2" />
      <rect x="7" y="-6" width="28" height="6" rx="2" />
    </>
  );
}

/** The robot, printed in the brand's gold: body, layer lines, face, the bolt on its chest. */
function Robot() {
  const pla = { fill: "var(--ws-pla)", stroke: "var(--ws-pla-edge)", strokeWidth: 1.6 } as const;
  return (
    <>
      <ellipse cx="0" cy="1" rx="48" ry="4" fill="#000" opacity="0.22" />
      <g {...pla}>
        <rect x="-2" y="-147" width="4" height="14" />
        <rect x="-38" y="-134" width="76" height="52" rx="10" />
        <rect x="-44" y="-117" width="7" height="18" rx="2" />
        <rect x="37" y="-117" width="7" height="18" rx="2" />
        <rect x="-12" y="-82" width="24" height="8" />
        <rect x="-66" y="-70" width="16" height="40" rx="8" />
        <rect x="-50" y="-75" width="100" height="58" rx="8" />
        <g className="vc-bot-leg-l">
          <rect x="-30" y="-18" width="18" height="13" />
          <rect x="-35" y="-6" width="28" height="6" rx="2" />
        </g>
        <g className="vc-bot-leg-r">
          <rect x="12" y="-18" width="18" height="13" />
          <rect x="7" y="-6" width="28" height="6" rx="2" />
        </g>
      </g>
      {/* layer lines: what makes a print read as printed */}
      <rect x="-70" y="-160" width="140" height="160" fill="url(#vc-layers)" clipPath="url(#vc-robot-clip-body)" />
      {/* the arm it waves with, apart so it can swing from the shoulder */}
      <g className="vc-bot-wave">
        <rect x="50" y="-70" width="16" height="40" rx="8" {...pla} />
        <rect x="50" y="-70" width="16" height="40" rx="8" fill="url(#vc-layers)" clipPath="url(#vc-arm-clip)" />
      </g>
      {/* face and chest panels, printed in a dark second colour */}
      <rect x="-30" y="-125" width="60" height="34" rx="7" fill="var(--ws-face)" />
      <circle className="vc-bot-eye" cx="-14" cy="-110" r="6.5" fill="var(--ws-eye-off)" />
      <circle className="vc-bot-eye" cx="14" cy="-110" r="6.5" fill="var(--ws-eye-off)" />
      <path d="M-8 -98h16" stroke="var(--ws-eye-off)" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="-22" y="-65" width="44" height="34" rx="4" fill="var(--ws-face)" />
      <path d="M4 -60l-11 14h9l-4 11 12-15h-9z" fill="var(--vc-gold)" />
      <circle className="vc-bot-led" cx="0" cy="-152" r="6" fill="var(--ws-pla)" stroke="var(--ws-pla-edge)" strokeWidth="1.5" />
      {/* the spark as it powers up */}
      <path
        className="vc-bot-spark"
        d="M-11 -162l-9-6M11 -162l9-6M0 -164v-10M-13 -150h-9M13 -150h9"
        stroke="var(--vc-gold)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </>
  );
}

/** A filament spool seen end on through the box's window: flange, filament, hub. */
function Spool({ cx, color, spin = false }: { cx: number; color: string; spin?: boolean }) {
  return (
    <g className={spin ? "vc-spool" : undefined}>
      <circle cx={cx} cy="131" r="17" fill="var(--ws-flange)" />
      <circle cx={cx} cy="131" r="14" fill={color} />
      <circle cx={cx} cy="131" r="10.5" fill="none" stroke="#000" strokeOpacity="0.14" strokeWidth="1" />
      <circle cx={cx} cy="131" r="6" fill="var(--ws-body)" />
      <path d={`M${cx - 4} 131h8M${cx} 127v8`} stroke="var(--ws-edge-hi)" strokeWidth="1.4" />
    </g>
  );
}

export function HeroWorkshop() {
  const text = "3D PRINTING";
  const tipW = text.length * 6.1 + 13;

  return (
    <div className="mx-auto w-full max-w-[500px]">
      <svg
        viewBox="20 40 570 520"
        className="vc-workshop w-full"
        role="group"
        aria-label="A 3D printer prints a small gold robot, which wakes up, hops out of the printer and waves"
      >
        <defs>
          <pattern id="vc-layers" patternUnits="userSpaceOnUse" width="8" height="5">
            <path d="M0 4.5H8" stroke="var(--ws-pla-line)" strokeWidth="1" />
          </pattern>
          <pattern id="vc-pei" patternUnits="userSpaceOnUse" width="5" height="5">
            <rect width="5" height="5" fill="#c99446" />
            <circle cx="1.5" cy="1.5" r="0.8" fill="#b07c33" />
            <circle cx="4" cy="3.8" r="0.6" fill="#ddb06a" />
          </pattern>
          <linearGradient id="vc-chamber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4d4842" />
            <stop offset="0.35" stopColor="#2c2c2f" />
            <stop offset="1" stopColor="#1b1c1f" />
          </linearGradient>
          <linearGradient id="vc-wall" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3a3936" />
            <stop offset="1" stopColor="#2a2a2d" />
          </linearGradient>
          <linearGradient id="vc-led" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff1d6" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff1d6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="vc-hot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3d0" stopOpacity="1" />
            <stop offset="0.15" stopColor="var(--vc-gold)" stopOpacity="0.95" />
            <stop offset="1" stopColor="var(--vc-gold)" stopOpacity="0" />
          </linearGradient>
          <clipPath id="vc-robot-clip">
            <RobotSilhouette />
          </clipPath>
          <clipPath id="vc-arm-clip">
            <rect x="50" y="-70" width="16" height="40" rx="8" />
          </clipPath>
          <clipPath id="vc-robot-clip-body">
            <RobotSilhouette waveArm={false} />
          </clipPath>
          {/* the chamber's opening: what is inside the machine shows only through it */}
          <clipPath id="vc-opening">
            <rect x="96" y="186" width="278" height="272" rx="6" />
          </clipPath>
          {/* everything above the nozzle is not printed yet */}
          <clipPath id="vc-printed">
            <rect x="0" y={NOZ} width="650" height="400" />
          </clipPath>
        </defs>

        {/* registration ticks, as on a drawing sheet */}
        <g stroke="var(--vc-line)" strokeWidth="1.5" fill="none">
          <path d="M24 62V44h18M568 44h18v18M586 538v18h-18M42 556H24v-18" />
        </g>

        {/* the shadow it stands in */}
        <path d="M70 522L118 494H452L440 528Z" fill="#000" opacity="0.08" />
        <ellipse cx="258" cy="524" rx="200" ry="7" fill="#000" opacity="0.07" />

        <a href={SITE.printingUrl} target="_blank" rel="noreferrer" className="vc-part" aria-label="3D printing">
          <rect className="vc-hit" x="34" y="80" width="410" height="446" rx="8" />
          <g className="vc-part-body">
            {/* ------------------------------------------------ filament box */}
            <path d="M366 104L392 88V142L366 158Z" fill="var(--ws-side)" />
            <path d="M108 104L134 88H392L366 104Z" fill="var(--ws-top)" />
            <path d="M126 100L140 92H382L368 100Z" fill="#000" opacity="0.28" />
            <rect x="108" y="104" width="258" height="54" rx="6" fill="var(--ws-body)" stroke="var(--ws-edge)" strokeWidth="1.2" />
            <rect x="118" y="112" width="238" height="38" rx="4" fill="#121316" />
            <Spool cx={150} color="#f0ae45" spin />
            <Spool cx={207} color="#ece9e2" />
            <Spool cx={264} color="#55585e" />
            <Spool cx={321} color="#c0412f" />
            {/* smoked lid over the window, and its shine */}
            <rect x="118" y="112" width="238" height="38" rx="4" fill="#2b2d31" opacity="0.32" />
            <path d="M126 113h70l-26 36h-44z" fill="#fff" opacity="0.06" />
            {/* the tube that feeds the printer from the box */}
            <path d="M372 132C398 128 420 136 414 160" fill="none" stroke="#d9d6cf" strokeWidth="3" strokeLinecap="round" opacity="0.85" />

            {/* ------------------------------------------------- the cube */}
            {/* side and top faces, drawn back from the front by the depth */}
            <path d="M390 172L432 146V492L390 518Z" fill="var(--ws-side)" stroke="var(--ws-edge)" strokeWidth="1.2" />
            <path d="M396 300l30-18M396 308l30-18M396 316l30-18M396 324l30-18M396 332l30-18" stroke="#000" strokeOpacity="0.3" strokeWidth="2" />
            <path d="M80 172L122 146H432L390 172Z" fill="var(--ws-top)" stroke="var(--ws-edge)" strokeWidth="1.2" />
            <path d="M100 166L131 150H368L366 158H134L132 166Z" fill="#a8b4bb" opacity="0.14" />
            {/* the front: one dark frame round the door, the screen below it */}
            <rect x="80" y="170" width="310" height="350" rx="14" fill="var(--ws-body)" stroke="var(--ws-edge)" strokeWidth="1.4" />
            <rect x="82.5" y="172.5" width="305" height="345" rx="12" fill="none" stroke="var(--ws-edge-hi)" strokeWidth="1" opacity="0.5" />

            {/* ------------------------------------------- inside the chamber */}
            <g clipPath="url(#vc-opening)">
              <rect x="96" y="160" width="300" height="300" fill="url(#vc-chamber)" />
              {/* the back wall, the left wall, the floor */}
              <rect x="130" y="165" width="278" height="272" fill="#232427" />
              <path d="M96 186L130 165V437L96 458Z" fill="url(#vc-wall)" />
              <path d="M96 458L130 437H408L374 458Z" fill="#161719" />
              {/* the light along the top of the door, and what it lights */}
              <rect x="96" y="186" width="278" height="120" fill="url(#vc-led)" />
              <rect x="110" y="188" width="250" height="3" rx="1.5" fill="#fff4dc" />
              {/* Z screws at the back corners, and the motion system up top */}
              <path d="M152 170V437M362 170V437" stroke="#8d9096" strokeWidth="3" />
              <path d="M152 170V437M362 170V437" stroke="#c9ccd1" strokeWidth="1" />
              <path d="M100 224L132 204M370 224L402 204" stroke="#55585e" strokeWidth="4" strokeLinecap="round" />
              <path d="M96 226H380" stroke="#121314" strokeWidth="6" />
              <path d="M96 224.5H380" stroke="#4a4d52" strokeWidth="1.2" />
            </g>

            {/* ------------------------------------------------- the bezel */}
            <rect x="106" y="472" width="72" height="30" rx="4" fill="#0e0f12" stroke="#3a3d42" strokeWidth="1" />
            <rect x="113" y="479" width="22" height="3" rx="1.5" fill="var(--vc-gold)" opacity="0.8" />
            <rect x="113" y="490" width="58" height="4" rx="2" fill="#2b2d31" />
            <rect className="vc-print-progress" x="113" y="490" width="58" height="4" rx="2" fill="var(--vc-gold)" />
            <circle className="vc-print-status" cx="166" cy="480.5" r="2.2" fill="var(--vc-gold)" />
            <text
              x="306"
              y="491"
              textAnchor="middle"
              fill="var(--ws-mark)"
              fontFamily="var(--font-mono)"
              fontSize="9.5"
              fontWeight="600"
              letterSpacing="3.2"
            >
              VOLTCRAFT
            </text>
          </g>
        </a>

        {/* ------------------------------------------------ the bed and the print.
            Both drop together while the head stays at the nozzle's height; the
            clip shows only what is below it, so the robot is built bottom up.
            Drawn after the bezel, so the robot walks out in front of it. */}
        <g clipPath="url(#vc-printed)">
          <g className="vc-bed">
            <g clipPath="url(#vc-opening)">
              <path d={`M146 ${PLATE + 8}h198v8h-198z`} fill="#26272a" />
              <path d={`M132 ${PLATE}L162 ${PLATE - 18}H366L336 ${PLATE}Z`} fill="url(#vc-pei)" />
              <path d={`M132 ${PLATE}h204v6h-204z`} fill="#9c7030" />
              <path d={`M136 ${PLATE - 2}L162 ${PLATE - 17}`} stroke="#000" strokeOpacity="0.15" strokeWidth="1" />
            </g>
            <g transform={`translate(${RX} ${NOZ}) scale(${S})`}>
              <g className="vc-bot">
                <Robot />
                {/* the fresh layer, glowing, kept at the nozzle while the robot drops */}
                <g clipPath="url(#vc-robot-clip)">
                  <g className="vc-print-heat">
                    <rect x="-70" y="0" width="140" height="22" fill="url(#vc-hot)" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>

        {/* the dust it kicks up landing on the floor */}
        <g className="vc-ws-dust" fill="var(--vc-line)">
          <circle cx="210" cy="546" r="4" />
          <circle cx="198" cy="542" r="3" />
          <circle cx="300" cy="546" r="4" />
          <circle cx="312" cy="542" r="3" />
        </g>

        {/* ---------------------------------------------------- the toolhead */}
        <g clipPath="url(#vc-opening)">
          <g className="vc-print-x">
            <rect x={RX - 22} y="206" width="44" height="44" rx="7" fill="#e3e0d9" stroke="#9a978f" strokeWidth="1" />
            <rect x={RX - 22} y="240" width="44" height="12" rx="4" fill="#2a2b2f" />
            <rect x={RX - 12} y="244" width="24" height="2.5" rx="1.25" className="vc-tool-led" fill="var(--vc-gold)" />
            <path d={`M${RX - 16} 213h32`} stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" />
            <path d={`M${RX - 5} 252h10l-4 ${NOZ - 253}h-2z`} fill="#b9bcc2" />
            <circle className="vc-nozzle-glow" cx={RX} cy={NOZ} r="4.5" fill="var(--vc-gold)" />
          </g>
        </g>

        {/* --------------------------------------------- the door, glass in a frame.
            It swings out to the left: the face folds to its hinge, then the door
            shows edge on beside the machine */}
        <g className="vc-door">
          <rect x="96" y="186" width="278" height="272" rx="6" fill="#a9bac4" opacity="0.1" />
          <path d="M150 186h70L120 458H96V330z" fill="#fff" opacity="0.07" />
          <path d="M248 186h26L174 458h-26z" fill="#fff" opacity="0.05" />
          <rect x="96" y="186" width="278" height="272" rx="6" fill="none" stroke="#3d4045" strokeWidth="3" />
          <rect x="362" y="296" width="5" height="48" rx="2.5" fill="#15161a" />
        </g>
        <g className="vc-door-open">
          <path d="M96 186L42 220V492L96 458Z" fill="#a9bac4" opacity="0.14" />
          <path d="M96 186L42 220V492L96 458Z" fill="none" stroke="#3d4045" strokeWidth="3" strokeLinejoin="round" />
          <path d="M84 196L58 212V300L84 284Z" fill="#fff" opacity="0.08" />
        </g>

        {/* the hover tip */}
        <g className="vc-tip">
          <rect x={249 - tipW / 2} y="62" width={tipW} height="15" rx="3" fill="var(--vc-ink)" />
          <text x="249" y="72.5" textAnchor="middle" fill="var(--vc-ground)" fontFamily="var(--font-mono)" fontSize="8.6" letterSpacing="0.9">
            {text}
          </text>
        </g>
      </svg>
    </div>
  );
}
