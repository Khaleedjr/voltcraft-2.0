/**
 * The hero's figure: a controller with the parts that talk to it, drawn the way
 * the rest of the site is drawn — plates on the drawing sheet, prussian line
 * work, current in gold.
 *
 * The first version of this was an abstract board, which read as decoration.
 * This one is legible on purpose: each peripheral is drawn as the part it
 * actually is — the two transducers of an ultrasonic sensor, a servo's horn and
 * mounting tabs, a relay's cube and screw terminals — and carries its name. A
 * visitor who has never bought a component should be able to tell what the shop
 * sells from this drawing alone.
 *
 * Every colour is a token, so it follows the theme; being line work rather than
 * a photograph it stays sharp at any size, costs a couple of kilobytes, and
 * needs nothing fetched.
 */

/** Part names, set like the small print on a drawing sheet. */
function Label({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="var(--vc-faint)"
      fontFamily="var(--font-mono)"
      fontSize="13"
      letterSpacing="1.4"
    >
      {children}
    </text>
  );
}

export function HeroFigure() {
  return (
    <figure className="mx-auto w-full max-w-[470px]">
      <svg
        viewBox="0 0 520 470"
        className="w-full"
        role="img"
        aria-label="Drawing of a microcontroller board wired to an ultrasonic sensor, a display, a servo and a relay"
      >
        {/* registration ticks, as on a drawing sheet */}
        <g stroke="var(--vc-line)" strokeWidth="1.5" fill="none">
          <path d="M4 22V4h18M498 4h18v18M516 448v18h-18M22 466H4v-18" />
        </g>

        {/* ------------------------------------------------ the wiring, in gold */}
        <g
          fill="none"
          stroke="var(--vc-gold)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M204 188V154H100v-34" />
          <path d="M316 188V154h104v-30" />
          <path d="M192 292v96h-32" />
          <path d="M328 292v86h28" />
        </g>

        {/* ------------------------------------------- 1. ultrasonic sensor, top left */}
        <Label x={100} y={34}>ULTRASONIC</Label>
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.6">
          <rect x="40" y="48" width="120" height="64" rx="4" />
          {/* the two transducers that make it recognisable */}
          <circle cx="72" cy="80" r="22" fill="var(--vc-raised)" />
          <circle cx="128" cy="80" r="22" fill="var(--vc-raised)" />
          <rect x="94" y="68" width="12" height="24" rx="2" />
        </g>
        <g fill="none" stroke="var(--vc-line)" strokeWidth="1.4">
          <circle cx="72" cy="80" r="13" />
          <circle cx="128" cy="80" r="13" />
        </g>
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.2">
          {[78, 90, 102, 114].map((x) => (
            <rect key={x} x={x} y="112" width="7" height="8" rx="1" />
          ))}
        </g>

        {/* ------------------------------------------------- 2. display, top right */}
        <Label x={420} y={34}>DISPLAY</Label>
        <rect
          x="358"
          y="46"
          width="124"
          height="70"
          rx="4"
          fill="var(--vc-sheet)"
          stroke="var(--vc-muted)"
          strokeWidth="1.6"
        />
        <rect x="370" y="56" width="100" height="44" rx="2" fill="var(--vc-block)" />
        {/* something on the screen, so it reads as lit */}
        <path
          d="M380 88l13-13 11 9 12-16 11 12 12-19 11 15"
          fill="none"
          stroke="var(--vc-gold)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.2">
          {[399, 411, 423, 435].map((x) => (
            <rect key={x} x={x} y="116" width="7" height="8" rx="1" />
          ))}
        </g>

        {/* ---------------------------------------------- 3. servo, bottom left */}
        <Label x={100} y={438}>SERVO</Label>
        {/* the horn and output shaft */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.5">
          <rect x="72" y="320" width="64" height="11" rx="5.5" />
          <circle cx="82" cy="325.5" r="8" fill="var(--vc-raised)" />
          {/* mounting tabs */}
          <rect x="34" y="339" width="26" height="11" rx="2" />
          <rect x="140" y="339" width="26" height="11" rx="2" />
          <rect x="58" y="336" width="84" height="16" rx="2" />
          <rect x="58" y="352" width="84" height="58" rx="3" fill="var(--vc-raised)" />
        </g>
        <g stroke="var(--vc-line)" strokeWidth="1.3" fill="none">
          <circle cx="112" cy="325.5" r="2.5" />
          <circle cx="124" cy="325.5" r="2.5" />
          <circle cx="45" cy="344.5" r="3" />
          <circle cx="155" cy="344.5" r="3" />
          <path d="M70 366h60M70 378h60" />
        </g>
        {/* the three-wire lead */}
        <g fill="none" stroke="var(--vc-muted)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M142 380h18M142 388h18M142 396h18" />
        </g>

        {/* --------------------------------------------- 4. relay, bottom right */}
        <Label x={420} y={438}>RELAY</Label>
        <rect
          x="356"
          y="344"
          width="128"
          height="68"
          rx="3"
          fill="var(--vc-sheet)"
          stroke="var(--vc-muted)"
          strokeWidth="1.6"
        />
        {/* the relay can, drawn as a box with a lid so it reads as a component */}
        <g fill="var(--vc-raised)" stroke="var(--vc-muted)" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M368 364h44v36h-44z" />
          <path d="M368 364l7-8h44l-7 8z" fill="var(--vc-sheet)" />
          <path d="M412 364l7-8v36l-7 8z" fill="var(--vc-sheet)" />
        </g>
        <path d="M374 375h32" stroke="var(--vc-line)" strokeWidth="1.3" fill="none" />
        {/* the screw terminals the switched load goes into */}
        <rect
          x="424"
          y="356"
          width="48"
          height="44"
          rx="2"
          fill="var(--vc-raised)"
          stroke="var(--vc-muted)"
          strokeWidth="1.5"
        />
        <g fill="none" stroke="var(--vc-line)" strokeWidth="1.3">
          {[436, 448, 460].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="369" r="5.5" />
              <path d={`M${cx - 3.6} 369h7.2`} />
              <path d={`M${cx - 4.5} 384h9v8h-9z`} />
            </g>
          ))}
        </g>
        {/* the pins that plug into the controller */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-muted)" strokeWidth="1.2">
          {[372, 384, 396, 408].map((x) => (
            <rect key={x} x={x} y="412" width="7" height="8" rx="1" />
          ))}
        </g>

        {/* -------------------------------------------- the board, in the middle */}
        <rect
          x="176"
          y="188"
          width="168"
          height="104"
          rx="8"
          fill="var(--vc-raised)"
          stroke="var(--vc-line)"
          strokeWidth="1.6"
        />
        {/* usb in */}
        <rect
          x="159"
          y="222"
          width="19"
          height="26"
          rx="2"
          fill="var(--vc-sheet)"
          stroke="var(--vc-muted)"
          strokeWidth="1.5"
        />
        {/* mounting holes */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.4">
          <circle cx="190" cy="202" r="5" />
          <circle cx="330" cy="202" r="5" />
          <circle cx="190" cy="278" r="5" />
          <circle cx="330" cy="278" r="5" />
        </g>
        {/* pin headers */}
        <g fill="var(--vc-sheet)" stroke="var(--vc-line)" strokeWidth="1.2">
          {[212, 228, 244, 260, 276, 292, 308].map((x) => (
            <rect key={`t${x}`} x={x} y="194" width="9" height="9" rx="1.5" />
          ))}
          {[212, 228, 244, 260, 276, 292, 308].map((x) => (
            <rect key={`b${x}`} x={x} y="273" width="9" height="9" rx="1.5" />
          ))}
        </g>
        {/* the chip */}
        <rect
          x="238"
          y="222"
          width="48"
          height="44"
          rx="3"
          fill="var(--vc-sheet)"
          stroke="var(--vc-muted)"
          strokeWidth="1.6"
        />
        <circle cx="246" cy="230" r="3" fill="var(--vc-muted)" />
        <g stroke="var(--vc-muted)" strokeWidth="1.3">
          {[230, 240, 250, 260].map((y) => (
            <path key={y} d={`M238 ${y}h-8M286 ${y}h8`} />
          ))}
        </g>
        {/* traces, running from the headers in to the chip */}
        <g fill="none" stroke="var(--vc-line)" strokeWidth="1.4" strokeLinejoin="round">
          <path d="M216 203v10h18v10" />
          <path d="M312 203v14h-22" />
          <path d="M216 273v-10h16v-8" />
          <path d="M312 273v-14h-22" />
        </g>

        {/* the nodes where wires meet a part */}
        <g fill="var(--vc-gold)">
          <circle cx="204" cy="188" r="4" />
          <circle cx="316" cy="188" r="4" />
          <circle cx="192" cy="292" r="4" />
          <circle cx="328" cy="292" r="4" />
        </g>

        <Label x={260} y={316}>CONTROLLER</Label>
      </svg>
      <figcaption className="vc-fig mt-4 text-center text-faint">
        Fig. 01 — a controller, and the parts that talk to it
      </figcaption>
    </figure>
  );
}
