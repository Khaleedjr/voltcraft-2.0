"use client";

import { useState } from "react";
import { Icon } from "@/components/admin/icons";

/**
 * A product photo at list size. A plain <img>, not next/image: the admin
 * shows whatever URL is stored, including one just pasted that the shop's
 * optimiser may not be allowed to fetch — and if it will not load, it says so
 * with a drawn chip rather than a broken-image icon.
 */
export function Thumb({ src, alt, size = 44, fill = false }: { src?: string; alt: string; size?: number; fill?: boolean }) {
  const [failed, setFailed] = useState(false);
  // fill: take the whole of a square parent instead of a fixed size
  const box = fill ? { width: "100%", height: "100%" } : { width: size, height: size };
  if (!src || failed) {
    return (
      <span style={box} className="grid shrink-0 place-items-center border border-line-soft bg-sheet text-faint" title={src ? "Photo did not load" : "No photo"}>
        <Icon.Products className="size-[45%]" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see the note above
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      // an image that failed before hydration fired its error event with no
      // listener attached; catch that case when the element is attached
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
      }}
      style={box}
      className="shrink-0 border border-line-soft bg-white object-contain p-0.5"
    />
  );
}
