import Image from "next/image";
import { SITE } from "@/lib/site";

/**
 * The VoltCraft mark, in whichever theme is showing.
 *
 * It used to be flipped for dark with `filter: invert(1)`, which worked while
 * the artwork was entirely black. It is not any more: half of it is the brand
 * gold, and inverting gold gives blue. So there are two files — the second has
 * only the achromatic ink (VOLT, the bolt, the tagline) lifted to white, with
 * the gold untouched — and CSS picks between them off <html data-theme>, the
 * same way the theme toggle picks its icon. Both are in the markup, so the
 * right one is showing before any JavaScript runs.
 *
 * "logo" is the full lockup with the tagline; "wordmark" is VOLT CRAFT alone.
 */

const ART = {
  wordmark: { file: "voltcraft-wordmark", width: 1282, height: 760 },
  logo: { file: "voltcraft-logo", width: 1293, height: 895 },
} as const;

export function Wordmark({
  variant = "wordmark",
  className = "",
  priority = false,
}: {
  variant?: keyof typeof ART;
  className?: string;
  priority?: boolean;
}) {
  const { file, width, height } = ART[variant];
  return (
    <>
      <Image
        src={`/brand/${file}.png`}
        alt={SITE.name}
        width={width}
        height={height}
        priority={priority}
        className={`vc-when-light ${className}`}
      />
      {/* the same mark; the accessible name is already on the one above */}
      <Image
        src={`/brand/${file}-dark.png`}
        alt=""
        aria-hidden
        width={width}
        height={height}
        priority={priority}
        className={`vc-when-dark ${className}`}
      />
    </>
  );
}
