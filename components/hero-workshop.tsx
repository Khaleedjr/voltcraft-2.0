import Link from "next/link";
import { SITE } from "@/lib/site";
import "./hero-workshop.css";

/**
 * The hero's figure: the workshop, as a story told on a loop.
 *
 *   1. The printer prints a robot. The gantry climbs with the print, the
 *      hotend sweeps each layer on a moving belt, and the layer just laid
 *      glows gold and cools as the next goes down on it.
 *   2. The head parks; the robot wakes, eyes then antenna, and hops.
 *   3. It walks out of the printer, jumps down to the floor and walks off,
 *      and the arm waves it out.
 *   4. The printer homes and starts the next one.
 *
 * Everything runs on one 14s clock (see "the workshop" in globals.css), so the
 * gantry, the reveal, the glow, the walk and the wave can never drift apart.
 * The hotend sweep, the belt and the fan are on short clocks of their own,
 * because they only need to look busy. It is CSS on SVG, with no script and
 * nothing to hydrate. Under prefers-reduced-motion it holds the finished robot
 * standing on the bed, awake.
 *
 * The robot is drawn once, about its own origin (feet at 0, centre at 0), and
 * placed on the bed by a plain transform attribute. CSS transforms go on
 * wrappers that carry no attribute, because a CSS transform replaces an
 * element's transform attribute rather than composing with it.
 *
 * The printer and the arm are doors: the printer opens the print service, the
 * arm the actuators aisle. Because the drawing holds links it is role="group",
 * not role="img", which would hide them from assistive tech.
 */

/** Where the robot stands while it is printed. */
const RX = 225;
const BED = 388;
/** How tall the robot is: the distance the gantry climbs. */
const H = 158;

function Door({
  href,
  label,
  external = false,
  hit,
  tip,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  hit: [number, number, number, number];
  tip: [number, number];
  children: React.ReactNode;
}) {
  const text = label.toUpperCase();
  const w = text.length * 6.1 + 13;
  const inner = (
    <>
      <rect className="vc-hit" x={hit[0]} y={hit[1]} width={hit[2]} height={hit[3]} rx="6" />
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
          {text}
        </text>
      </g>
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className="vc-part" aria-label={label}>
      {inner}
    </a>
  ) : (
    <Link href={href} className="vc-part" aria-label={label}>
      {inner}
    </Link>
  );
}

/** The robot's silhouette about its own origin: used to clip its layer lines and its glow. */
function RobotSilhouette() {
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
      <rect x="50" y="-70" width="16" height="40" rx="8" />
      <rect x="-30" y="-18" width="18" height="13" />
      <rect x="12" y="-18" width="18" height="13" />
      <rect x="-35" y="-6" width="28" height="6" rx="2" />
      <rect x="7" y="-6" width="28" height="6" rx="2" />
    </>
  );
}

/** The robot as drawn: body, layer lines, face and the bolt on its chest. */
function Robot() {
  const part = { fill: "var(--vc-raised)", stroke: "var(--vc-muted)", strokeWidth: 1.7 } as const;
  return (
    <>
      {/* its shadow, so it stands on whatever it is on */}
      <ellipse cx="0" cy="1" rx="46" ry="3.5" fill="var(--vc-ink)" opacity="0.08" />
      <g {...part}>
        <rect x="-2" y="-147" width="4" height="14" />
        <rect x="-38" y="-134" width="76" height="52" rx="10" />
        <rect x="-44" y="-117" width="7" height="18" rx="2" />
        <rect x="37" y="-117" width="7" height="18" rx="2" />
        <rect x="-12" y="-82" width="24" height="8" />
        <rect x="-66" y="-70" width="16" height="40" rx="8" />
        <rect x="50" y="-70" width="16" height="40" rx="8" />
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
      <rect x="-70" y="-160" width="140" height="160" fill="url(#vc-layers)" clipPath="url(#vc-robot-clip)" />
      <circle className="vc-bot-eye" cx="-17" cy="-108" r="7.5" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
      <circle className="vc-bot-eye" cx="17" cy="-108" r="7.5" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
      <path d="M-12 -94h24M-9 -90h18" stroke="var(--vc-muted)" strokeWidth="1.4" />
      <rect x="-22" y="-65" width="44" height="34" rx="4" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4" />
      <path d="M4 -60l-11 14h9l-4 11 12-15h-9z" fill="var(--vc-gold)" />
      <circle className="vc-bot-led" cx="0" cy="-152" r="6" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
      {/* the spark as it powers up */}
      <path
        className="vc-bot-spark"
        d="M-11 -162l-9-6M11 -162l9-6M0 -164v-10M-13 -150h-9M13 -150h9"
        stroke="var(--vc-gold)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </>
  );
}

export function HeroWorkshop() {
  const ink = { fill: "var(--vc-sheet)", stroke: "var(--vc-muted)", strokeWidth: 1.8 } as const;
  const raised = { fill: "var(--vc-raised)", stroke: "var(--vc-muted)", strokeWidth: 1.6 } as const;
  const line = { fill: "none", stroke: "var(--vc-line)", strokeWidth: 1.2 } as const;

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <svg
        viewBox="0 0 650 520"
        className="vc-workshop w-full"
        role="group"
        aria-label="A 3D printer prints a small robot, which wakes up and walks off past a robotic arm"
      >
        <defs>
          <pattern id="vc-layers" patternUnits="userSpaceOnUse" width="8" height="5">
            <path d="M0 4.5H8" stroke="var(--vc-trace)" strokeWidth="1" />
          </pattern>
          <pattern id="vc-heatbed" patternUnits="userSpaceOnUse" width="6" height="6">
            <path d="M-1 7L7-1" stroke="var(--vc-trace)" strokeWidth="0.85" fill="none" />
          </pattern>
          <clipPath id="vc-robot-clip">
            <RobotSilhouette />
          </clipPath>
          {/* the same silhouette where it is printed, for the fresh-layer glow */}
          <clipPath id="vc-robot-clip-bed">
            <g transform={`translate(${RX} ${BED})`}>
              <RobotSilhouette />
            </g>
          </clipPath>
          {/* the layer just laid is hot: gold at the top edge, cooling below */}
          <linearGradient id="vc-hot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--vc-gold)" stopOpacity="1" />
            <stop offset="0.2" stopColor="var(--vc-gold)" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--vc-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* registration ticks, as on a drawing sheet */}
        <g stroke="var(--vc-line)" strokeWidth="1.5" fill="none">
          <path d="M4 22V4h18M628 4h18v18M646 498v18h-18M22 516H4v-18" />
        </g>

        {/* shadows that ground the machines on the floor */}
        <ellipse cx="225" cy="466" rx="190" ry="6" fill="var(--vc-ink)" opacity="0.07" />
        <ellipse cx="526" cy="466" rx="64" ry="5" fill="var(--vc-ink)" opacity="0.08" />

        {/* ------------------------------------------------------- printer */}
        <Door href={SITE.printingUrl} external label="3D printing" hit={[44, 0, 360, 470]} tip={[225, 486]}>
          {/* filament: the spool on its arm, the strand down into the feeder */}
          <path d="M320 48V30" stroke="var(--vc-muted)" strokeWidth="2" />
          <g className="vc-spool">
            <circle cx="320" cy="26" r="22" {...ink} />
            <circle cx="320" cy="26" r="15" fill="none" stroke="var(--vc-gold)" strokeWidth="6" opacity="0.9" />
            <circle cx="320" cy="26" r="6" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.5" />
            <path d="M320 11v5M333 26h-5M320 41v-5M307 26h5" stroke="var(--vc-muted)" strokeWidth="1.2" />
          </g>
          <path d="M302 36c-12 4-18 6-24 8" fill="none" stroke="var(--vc-gold)" strokeWidth="2" />

          {/* the build chamber: the back plate the reveal panel matches */}
          <rect x="82" y="70" width="286" height="320" fill="var(--vc-sheet)" />
          <path d="M92 96h14M92 96v14M358 96h-14M358 96v14" stroke="var(--vc-line)" strokeWidth="1.2" fill="none" />

          {/* frame, Z screws and their steppers under the top bar */}
          <rect x="60" y="48" width="330" height="22" rx="4" {...ink} />
          <rect x="60" y="60" width="22" height="364" rx="3" {...ink} />
          <rect x="368" y="60" width="22" height="364" rx="3" {...ink} />
          <path d="M71 90V416M379 90V416" stroke="var(--vc-line)" strokeWidth="1.4" strokeDasharray="2 4" fill="none" />
          <rect x="62" y="71" width="18" height="16" rx="2" {...raised} />
          <rect x="370" y="71" width="18" height="16" rx="2" {...raised} />
          <rect x="268" y="40" width="20" height="16" rx="2" {...raised} />
          <text x="92" y="63" fill="var(--vc-muted)" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="2.4">
            VOLTCRAFT
          </text>
          <circle className="vc-print-status" cx="252" cy="59" r="3.5" fill="var(--vc-gold)" />

          {/* the bed: plate, heated layer under it, clips at its corners */}
          <rect x="102" y={BED} width="246" height="12" rx="2" {...ink} />
          <rect x="110" y={BED + 12} width="230" height="10" fill="url(#vc-heatbed)" stroke="var(--vc-line)" strokeWidth="1" />
          <path d={`M108 ${BED - 3}h10M332 ${BED - 3}h10`} stroke="var(--vc-muted)" strokeWidth="2.2" />

          {/* base: screen with the job's progress, the dial, the vents */}
          <rect x="50" y="420" width="350" height="44" rx="6" {...ink} />
          <rect x="70" y="430" width="112" height="24" rx="3" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.4" />
          <rect x="78" y="439" width="96" height="6" rx="3" fill="var(--vc-line)" opacity="0.5" />
          <rect className="vc-print-progress" x="78" y="439" width="96" height="6" rx="3" fill="var(--vc-gold)" />
          <circle cx="206" cy="442" r="9" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.5" />
          <circle cx="206" cy="442" r="3" fill="var(--vc-muted)" />
          <path d="M300 433v18M312 433v18M324 433v18M336 433v18M348 433v18M360 433v18M372 433v18" {...line} />
        </Door>

        {/* ----------------------------------------------------------- arm */}
        <Door href="/shop/actuators" label="Actuators" hit={[420, 240, 210, 230]} tip={[560, 486]}>
          <rect x="470" y="446" width="112" height="18" rx="4" {...ink} />
          <circle cx="482" cy="455" r="2.5" fill="var(--vc-muted)" />
          <circle cx="570" cy="455" r="2.5" fill="var(--vc-muted)" />
          <rect x="495" y="426" width="62" height="22" rx="6" {...raised} />
          <g className="vc-arm-shoulder">
            <rect x="513" y="292" width="24" height="124" rx="12" {...ink} />
            <path d="M531 404c6-30 6-70 0-100" stroke="var(--vc-trace)" strokeWidth="1.6" fill="none" />
            <g className="vc-arm-elbow">
              <rect x="434" y="284" width="103" height="24" rx="12" {...ink} />
              <path d="M515 290c-20-6-44-6-66 0" stroke="var(--vc-trace)" strokeWidth="1.6" fill="none" />
              <circle cx="444" cy="296" r="11" {...raised} strokeWidth={1.7} />
              <g className="vc-jaw vc-jaw-a">
                <path d="M436 289l-22-10-6 6 18 10" {...raised} strokeLinejoin="round" />
              </g>
              <g className="vc-jaw vc-jaw-b">
                <path d="M436 303l-22 10-6-6 18-10" {...raised} strokeLinejoin="round" />
              </g>
              <circle cx="444" cy="296" r="4" fill="var(--vc-gold)" />
              <circle cx="525" cy="296" r="15" {...raised} strokeWidth={1.8} />
              <circle cx="525" cy="296" r="6" fill="var(--vc-gold)" />
            </g>
          </g>
          <circle cx="525" cy="410" r="19" {...raised} strokeWidth={1.8} />
          <circle cx="525" cy="410" r="7" fill="var(--vc-gold)" />
          <path d="M525 396v-4M539 410h4M525 424v4M511 410h-4" stroke="var(--vc-muted)" strokeWidth="1.6" />
        </Door>

        {/* the robot, drawn over the machines so it walks in front of what it
            passes; then the panel that hides what is not printed yet, lifting
            from the bed up as the layers go down; then the gantry over both */}
        <g transform={`translate(${RX} ${BED})`}>
          <g className="vc-bot">
            <Robot />
          </g>
        </g>
        <rect className="vc-print-cover" x="146" y={BED - H - 2} width="158" height={H + 2} fill="var(--vc-sheet)" />
        {/* the fresh layer, glowing, clipped to the robot where it is printed */}
        <g clipPath="url(#vc-robot-clip-bed)">
          <g className="vc-print-heat">
            <rect x="146" y={BED} width="158" height="22" fill="url(#vc-hot)" />
            <rect x="146" y={BED} width="158" height="2.5" fill="var(--vc-gold)" />
          </g>
        </g>

        {/* the gantry: it climbs with the print, the hotend sweeps on its belt */}
        <g className="vc-print-gantry">
          <rect x="56" y="326" width="34" height="34" rx="4" {...raised} />
          <rect x="360" y="326" width="34" height="34" rx="4" {...raised} />
          <path d="M90 334H360" stroke="var(--vc-muted)" strokeWidth="2.2" />
          <path className="vc-print-belt" d="M90 352H360" stroke="var(--vc-muted)" strokeWidth="2.4" strokeDasharray="3 3" />
          <circle cx="78" cy="352" r="5" {...raised} />
          <circle cx="372" cy="352" r="5" {...raised} />
          <g className="vc-print-x">
            <rect x="200" y="322" width="50" height="40" rx="4" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.7" />
            <circle cx="225" cy="342" r="11" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4" />
            <g className="vc-print-fan">
              <path d="M225 342l0-9M225 342l8 5M225 342l-8 5" stroke="var(--vc-muted)" strokeWidth="2" strokeLinecap="round" />
            </g>
            <circle cx="225" cy="342" r="2.2" fill="var(--vc-muted)" />
            <rect x="213" y="362" width="24" height="14" rx="2" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
            <path d="M215 366h20M215 370h20" stroke="var(--vc-line)" strokeWidth="1" />
            <path d={`M219 376h12l-6 ${BED - 376}z`} fill="var(--vc-muted)" />
            <circle className="vc-nozzle-glow" cx="225" cy={BED - 1} r="5" fill="var(--vc-gold)" />
          </g>
        </g>

        {/* the dust it kicks up landing on the floor */}
        <g className="vc-ws-dust" fill="var(--vc-line)">
          <circle cx="396" cy="459" r="4" />
          <circle cx="384" cy="455" r="3" />
          <circle cx="498" cy="459" r="4" />
          <circle cx="510" cy="455" r="3" />
        </g>

        {/* the floor line and a dimension line, because the sheet always carries one */}
        <path d="M40 464H612" stroke="var(--vc-line)" strokeWidth="1.2" />
        <g stroke="var(--vc-faint)" strokeWidth="1.1">
          <path d="M50 500h550M50 494v12M600 494v12" />
        </g>
      </svg>
    </div>
  );
}
