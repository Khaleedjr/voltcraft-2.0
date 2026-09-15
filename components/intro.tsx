"use client";

import Image from "next/image";
import { useEffect } from "react";
import { SITE } from "@/lib/site";

/** Matches the vc-intro-veil animation in globals.css. */
const RUN_MS = 1600;
const BAIL_MS = 250;
const KEY = "vc-intro";

/**
 * Runs before the overlay is painted, on a hard load: if the intro has already
 * played this session, mark it done so CSS hides it outright and the visitor
 * goes straight to the page. Rendered as inert text/plain on the client, where
 * injected scripts do not execute anyway.
 */
function SeenScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(function(){try{if(sessionStorage.getItem("${KEY}"))document.documentElement.setAttribute("data-intro","done")}catch(e){}})()`,
      }}
    />
  );
}

/**
 * The home page's title card: an arc of current draws across the screen and
 * the wordmark ignites off it, then the whole thing pulls away.
 *
 * The animation itself is CSS with fill-mode: forwards, so it clears itself
 * with or without this component. What runs here is only the courtesy — play
 * it once per session, and get out of the way the moment anyone touches
 * anything.
 */
export function Intro() {
  useEffect(() => {
    const root = document.documentElement;

    // Already played, or a soft navigation back to the home page.
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem(KEY));
    } catch {
      // Storage walled off — the intro just plays each time.
    }
    if (seen) {
      root.setAttribute("data-intro", "done");
      return;
    }
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      // as above
    }

    let bail: number | undefined;
    const finish = window.setTimeout(() => root.setAttribute("data-intro", "done"), RUN_MS);

    // Anyone who reaches for the page wants the page, not the title card.
    const skip = () => {
      if (root.getAttribute("data-intro")) return;
      root.setAttribute("data-intro", "skipping");
      bail = window.setTimeout(() => root.setAttribute("data-intro", "done"), BAIL_MS);
    };

    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", skip, opts);
    window.addEventListener("keydown", skip, opts);
    window.addEventListener("wheel", skip, opts);
    window.addEventListener("touchmove", skip, opts);

    return () => {
      window.clearTimeout(finish);
      if (bail) window.clearTimeout(bail);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
    };
  }, []);

  return (
    <>
      <SeenScript />
      <div className="vc-intro" aria-hidden>
        <div className="vc-intro-core">
          {/* the arc: a soft red discharge with a white filament inside it */}
          <svg className="vc-intro-arc" viewBox="0 0 1 0.2" aria-hidden>
            <path className="vc-bolt vc-bolt-glow" pathLength="1" d={ARC} />
            <path className="vc-bolt vc-bolt-core" pathLength="1" d={ARC} />
          </svg>
          <span className="vc-intro-ring" />
          <Image
            src="/brand/voltcraft-wordmark.png"
            alt=""
            width={1200}
            height={724}
            priority
            className="vc-intro-mark"
          />
        </div>
        <p className="vc-fig vc-intro-tag">{SITE.tagline}</p>
        <span className="vc-intro-flash" />
      </div>
    </>
  );
}

/* A jagged discharge across a 1 × 0.2 box, so it scales with the wordmark.
   The steps are deliberately uneven — evenly spaced ones read as a sawtooth. */
const ARC =
  "M0 .100 L.086 .094 L.132 .040 L.188 .118 L.246 .030 L.286 .092 L.356 .012 L.404 .106 L.468 .052 L.520 .128 L.592 .022 L.646 .100 L.712 .062 L.782 .122 L.844 .074 L.906 .104 L1 .096";
