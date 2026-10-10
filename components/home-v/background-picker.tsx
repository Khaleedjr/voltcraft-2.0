"use client";

import { useEffect, useState } from "react";

export const BACKGROUNDS = [
  { key: "", label: "Site", name: "Site (glow)" },
  { key: "1", label: "A", name: "Perfboard" },
  { key: "2", label: "B", name: "Circuit" },
  { key: "3", label: "C", name: "Isometric" },
  { key: "4", label: "D", name: "Contours" },
  { key: "5", label: "E", name: "Glow" },
] as const;

const KEY = "vc-preview-bg";

/**
 * Runs before the page paints, so a chosen background never flashes the grid
 * first. ?bg=1..5 in the address wins (so a link can carry the choice), then
 * the last choice made on this device.
 */
export const BG_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get("bg");var v=q!==null?q:localStorage.getItem("${KEY}");if(q!==null)localStorage.setItem("${KEY}",q);if(v&&/^[1-5]$/.test(v))document.documentElement.setAttribute("data-bg",v);else document.documentElement.removeAttribute("data-bg")}catch(e){}})()`;

/** The switcher's second row: the page background, tried on any version. */
export function BackgroundPicker() {
  const [bg, setBg] = useState("");

  useEffect(() => {
    // read what the early script chose; the attribute lives outside React
    const v = document.documentElement.getAttribute("data-bg") ?? "";
    const t = setTimeout(() => setBg(v), 0);
    return () => clearTimeout(t);
  }, []);

  const choose = (key: string) => {
    const root = document.documentElement;
    if (key) root.setAttribute("data-bg", key);
    else root.removeAttribute("data-bg");
    try {
      localStorage.setItem(KEY, key);
    } catch {}
    const url = new URL(window.location.href);
    if (key) url.searchParams.set("bg", key);
    else url.searchParams.delete("bg");
    window.history.replaceState(window.history.state, "", url);
    setBg(key);
  };

  const current = BACKGROUNDS.find((b) => b.key === bg) ?? BACKGROUNDS[0];
  return (
    <div className="flex items-center gap-1 border-t border-white/15 pt-1" role="group" aria-label="Background">
      <span className="hidden px-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/60 sm:inline">Background</span>
      {BACKGROUNDS.map((b) => (
        <button
          key={b.label}
          type="button"
          title={b.name}
          aria-pressed={b.key === bg}
          onClick={() => choose(b.key)}
          className={`grid h-8 min-w-8 place-items-center px-2 font-mono text-[0.72rem] ${b.key === bg ? "bg-gold text-live-ink" : "hover:bg-white/10"}`}
        >
          {b.label}
        </button>
      ))}
      <span className="px-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/80">{current.name}</span>
    </div>
  );
}
