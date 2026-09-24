import "server-only";
import type { Product } from "@/lib/catalogue";
import { getProduct } from "@/lib/catalogue-data";

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
      { slug: "esp32-development-board-type-c-usb", qty: 1, why: "Wi-Fi and deep sleep" },
      { slug: "dht22-am2303-temprature-sensor", qty: 1, why: "Temperature and humidity" },
      { slug: "capacitive-soil-moisture-sensor", qty: 1, why: "Survives being left in soil" },
      { slug: "oled-screen-display-module", qty: 1, why: "On-device readout" },
      { slug: "18650-lithium-battery-3-7v", qty: 1, why: "The cell" },
      { slug: "3-7v-lithium-battery-charger", qty: 1, why: "Charging" },
      { slug: "breadboard-830-tie-points", qty: 1, why: "Build it before you solder it" },
      { slug: "jumper-wires-pieces", qty: 20, why: "Wiring" },
    ],
  },
];

export type ResolvedKit = Kit & {
  items: { product: Product; qty: number; why: string; lineTotal: number }[];
  total: number;
};

export async function resolveKit(kit: Kit): Promise<ResolvedKit> {
  const resolved = await Promise.all(kit.lines.map(async (line) => ({ line, product: await getProduct(line.slug) })));
  const items = resolved.flatMap(({ line, product }) => {
    if (!product) return [];
    return [{ product, qty: line.qty, why: line.why, lineTotal: product.price * line.qty }];
  });
  return { ...kit, items, total: items.reduce((n, i) => n + i.lineTotal, 0) };
}

export async function getKit(slug: string): Promise<ResolvedKit | undefined> {
  const kit = KITS.find((k) => k.slug === slug);
  return kit ? resolveKit(kit) : undefined;
}
