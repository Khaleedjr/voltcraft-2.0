import Link from "next/link";
import { SITE } from "@/lib/site";

/**
 * The hero's figure: the workshop. A 3D printer prints a small robot, layer by
 * layer, while a servo arm works beside it. It is drawn the way the rest of
 * the site is drawn, as line work on the drawing sheet with gold for anything
 * live, and it says what the shop is for: parts to build robots, and a print
 * service to make what nobody sells.
 *
 * One cycle tells the story. The gantry climbs as the print rises, the hotend
 * sweeps each layer, the screen's progress bar fills; the finished robot opens
 * its eyes and its antenna lights; then the print clears, the gantry homes and
 * it starts again. The arm idles through its own slower rhythm, so the two
 * never fall into step. It is CSS on SVG, with no script and nothing to
 * hydrate, and under prefers-reduced-motion it holds the finished print.
 *
 * The reveal is a panel in the build chamber's own colour lifted off the model
 * from the bed up, kept in step with the gantry so the nozzle always sits on
 * the newest layer. Both move 160 units: PRINT_TOP to BED.
 *
 * The printer and the arm are doors, as the old board's parts were: the printer
 * opens the print service, the arm the actuators aisle. Because the drawing
 * holds links it is role="group", not role="img", which would hide them.
 */

const BED = 388;
const PRINT_TOP = 228;

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

/** The robot being printed, as plain shapes: drawn once, clipped once for its layer lines. */
function RobotShapes() {
  return (
    <>
      <rect x="185" y="252" width="80" height="56" rx="10" />
      <rect x="212" y="308" width="26" height="8" />
      <rect x="172" y="316" width="106" height="72" rx="8" />
      <rect x="154" y="322" width="18" height="46" rx="8" />
      <rect x="278" y="322" width="18" height="46" rx="8" />
      <rect x="223" y="236" width="4" height="16" />
      <circle cx="225" cy="236" r="6" />
    </>
  );
}

export function HeroWorkshop() {
  const ink = { fill: "var(--vc-sheet)", stroke: "var(--vc-muted)", strokeWidth: 1.8 } as const;
  const line = { fill: "none", stroke: "var(--vc-line)", strokeWidth: 1.2 } as const;

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <svg
        viewBox="0 0 650 520"
        className="vc-workshop w-full"
        role="group"
        aria-label="A 3D printer printing a small robot, beside a robotic arm"
      >
        <defs>
          {/* layer lines: what makes a print read as printed */}
          <pattern id="vc-layers" patternUnits="userSpaceOnUse" width="8" height="5">
            <path d="M0 4.5H8" stroke="var(--vc-trace)" strokeWidth="1" />
          </pattern>
          <pattern id="vc-heatbed" patternUnits="userSpaceOnUse" width="6" height="6">
            <path d="M-1 7L7-1" stroke="var(--vc-trace)" strokeWidth="0.85" fill="none" />
          </pattern>
          <clipPath id="vc-robot-clip">
            <RobotShapes />
          </clipPath>
        </defs>

        {/* registration ticks, as on a drawing sheet */}
        <g stroke="var(--vc-line)" strokeWidth="1.5" fill="none">
          <path d="M4 22V4h18M628 4h18v18M646 498v18h-18M22 516H4v-18" />
        </g>

        {/* ------------------------------------------------------- printer */}
        <Door href={SITE.printingUrl} external label="3D printing" hit={[44, 0, 360, 470]} tip={[225, 486]}>
          {/* the filament spool on the top bar, and the strand into the feeder */}
          <g className="vc-spool">
            <circle cx="320" cy="26" r="22" {...ink} />
            <circle cx="320" cy="26" r="15" fill="none" stroke="var(--vc-gold)" strokeWidth="5" opacity="0.85" />
            <circle cx="320" cy="26" r="6" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.5" />
          </g>
          <path d="M300 34c-14 6-20 10-24 14" fill="none" stroke="var(--vc-gold)" strokeWidth="2" />

          {/* the build chamber: the back plate the reveal panel matches */}
          <rect x="82" y="70" width="286" height="320" fill="var(--vc-sheet)" />

          {/* frame: two uprights carrying the Z screws, the top bar, the base */}
          <rect x="60" y="48" width="330" height="22" rx="4" {...ink} />
          <rect x="60" y="60" width="22" height="364" rx="3" {...ink} />
          <rect x="368" y="60" width="22" height="364" rx="3" {...ink} />
          <path d="M71 74V416M379 74V416" stroke="var(--vc-line)" strokeWidth="1.4" strokeDasharray="2 4" fill="none" />
          <rect x="268" y="40" width="20" height="16" rx="2" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.5" />
          {/* the maker's mark on the top bar, and a status light that blinks while it prints */}
          <text x="92" y="63" fill="var(--vc-muted)" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="2.4">
            VOLTCRAFT
          </text>
          <circle className="vc-print-status" cx="252" cy="59" r="3.5" fill="var(--vc-gold)" />

          {/* the bed: plate, heated layer under it, the clips at its corners */}
          <rect x="102" y={BED} width="246" height="12" rx="2" {...ink} />
          <rect x="110" y={BED + 12} width="230" height="10" fill="url(#vc-heatbed)" stroke="var(--vc-line)" strokeWidth="1" />
          <path d={`M108 ${BED - 3}h10M332 ${BED - 3}h10`} stroke="var(--vc-muted)" strokeWidth="2.2" />

          {/* the print, then the panel that lifts off it as the layers go down */}
          <g className="vc-print-model">
            <g fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.8">
              <RobotShapes />
            </g>
            <rect x="150" y="226" width="150" height={BED - 226} fill="url(#vc-layers)" clipPath="url(#vc-robot-clip)" />
            {/* face: eyes that open when the print is done, a grille, a bolt on the chest */}
            <circle className="vc-bot-eye" cx="207" cy="279" r="8" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
            <circle className="vc-bot-eye" cx="243" cy="279" r="8" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
            <path d="M212 297h26M215 301h20" stroke="var(--vc-muted)" strokeWidth="1.5" />
            <rect x="200" y="330" width="50" height="36" rx="5" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
            <path d="M229 336l-11 14h9l-4 11 12-15h-9z" fill="var(--vc-gold)" />
            <circle className="vc-bot-led" cx="225" cy="236" r="6" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6" />
          </g>
          <rect className="vc-print-cover" x="146" y={PRINT_TOP} width="158" height={BED - PRINT_TOP} fill="var(--vc-sheet)" />

          {/* the gantry: it climbs with the print, and the hotend sweeps each layer */}
          <g className="vc-print-gantry">
            <rect x="56" y="326" width="34" height="34" rx="4" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.6" />
            <rect x="360" y="326" width="34" height="34" rx="4" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.6" />
            <path d="M90 334H360M90 352H360" stroke="var(--vc-muted)" strokeWidth="2.2" />
            <g className="vc-print-x">
              <rect x="200" y="322" width="50" height="40" rx="4" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.7" />
              <circle cx="225" cy="342" r="11" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.4" />
              <path d="M225 331v22M214 342h22" stroke="var(--vc-line)" strokeWidth="1.2" />
              <rect x="213" y="362" width="24" height="14" rx="2" fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5" />
              <path d={`M219 376h12l-6 ${BED - 376}z`} fill="var(--vc-muted)" />
              <circle className="vc-nozzle-glow" cx="225" cy={BED - 1} r="5" fill="var(--vc-gold)" />
              <path d={`M216 ${BED}h18`} stroke="var(--vc-gold)" strokeWidth="2.4" strokeLinecap="round" />
            </g>
          </g>

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
        <Door href="/shop/actuators" label="Actuators" hit={[420, 260, 210, 210]} tip={[540, 486]}>
          <rect x="470" y="446" width="112" height="18" rx="4" {...ink} />
          <rect x="495" y="426" width="62" height="22" rx="6" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.7" />
          <g className="vc-arm-shoulder">
            <rect x="513" y="292" width="24" height="124" rx="12" {...ink} />
            <path d="M525 404V304" stroke="var(--vc-trace)" strokeWidth="1.4" strokeDasharray="5 4" />
            <g className="vc-arm-elbow">
              <rect x="434" y="284" width="103" height="24" rx="12" {...ink} />
              <path d="M447 296H515" stroke="var(--vc-trace)" strokeWidth="1.4" strokeDasharray="5 4" />
              {/* the gripper: a wrist, and two jaws that open and close */}
              <circle cx="444" cy="296" r="11" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.7" />
              <g className="vc-jaw vc-jaw-a">
                <path d="M436 289l-22-10-6 6 18 10" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.6" strokeLinejoin="round" />
              </g>
              <g className="vc-jaw vc-jaw-b">
                <path d="M436 303l-22 10-6-6 18-10" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.6" strokeLinejoin="round" />
              </g>
              <circle cx="444" cy="296" r="4" fill="var(--vc-gold)" />
              {/* elbow servo, gold horn */}
              <circle cx="525" cy="296" r="15" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.8" />
              <circle cx="525" cy="296" r="6" fill="var(--vc-gold)" />
            </g>
          </g>
          {/* shoulder servo sits over the arm's root */}
          <circle cx="525" cy="410" r="19" fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.8" />
          <circle cx="525" cy="410" r="7" fill="var(--vc-gold)" />
          <path d="M525 396v-4M539 410h4M525 424v4M511 410h-4" stroke="var(--vc-muted)" strokeWidth="1.6" />
        </Door>

        {/* the floor line and a dimension line, because the sheet always carries one */}
        <path d="M40 464H612" stroke="var(--vc-line)" strokeWidth="1.2" />
        <g stroke="var(--vc-faint)" strokeWidth="1.1">
          <path d="M50 500h550M50 494v12M600 494v12" />
        </g>
      </svg>
    </div>
  );
}
