import { getProduct, type Product } from "@/lib/catalogue";

/**
 * A kit is a bill of materials for a project people actually build, priced from
 * the live catalogue. It is the most useful thing a parts shop can publish:
 * it answers "what do I need to buy" rather than "what do you sell".
 */
export type KitLine = { slug: string; qty: number; why: string };

export type Kit = {
  slug: string;
  figure: string;
  name: string;
  blurb: string;
  lines: KitLine[];
};

export const KITS: Kit[] = [
  {
    slug: "soil-monitor-node",
    figure: "Fig. 3",
    name: "A battery-powered sensor node, kitted from one order.",
    blurb:
      "Reads its surroundings, sleeps between readings and pushes over Wi-Fi. Runs for weeks on one cell, and every part is on the shelf today.",
    lines: [
      { slug: "esp32-wroom-development-board", qty: 1, why: "Wi-Fi and deep sleep" },
      { slug: "dht22-temperature-humidity-sensor", qty: 1, why: "Temperature and humidity" },
      { slug: "soil-moisture-sensor", qty: 1, why: "What the node is actually watching" },
      { slug: "oled-096-i2c-display", qty: 1, why: "On-device readout" },
      { slug: "tp4056-charging-module", qty: 1, why: "USB-C charging" },
      { slug: "lm2596-buck-converter", qty: 1, why: "Clean 3.3 V rail" },
      { slug: "breadboard-830-point", qty: 1, why: "Build it before you solder it" },
      { slug: "jumper-wires-male-female", qty: 1, why: "Wiring" },
    ],
  },
];

export type ResolvedKit = Kit & {
  items: { product: Product; qty: number; why: string; lineTotal: number }[];
  total: number;
};

export function resolveKit(kit: Kit): ResolvedKit {
  const items = kit.lines.flatMap((line) => {
    const product = getProduct(line.slug);
    if (!product) return [];
    return [{ product, qty: line.qty, why: line.why, lineTotal: product.price * line.qty }];
  });
  return { ...kit, items, total: items.reduce((n, i) => n + i.lineTotal, 0) };
}

export function getKit(slug: string): ResolvedKit | undefined {
  const kit = KITS.find((k) => k.slug === slug);
  return kit ? resolveKit(kit) : undefined;
}
