#!/usr/bin/env node
/**
 * Generates the stepped keyframes at the bottom of components/hero-workshop.css:
 * the toolhead's passes over each layer, the robot's walk out and its legs, as
 * percentages of the hero's shared 12s clock.
 *
 *   node scripts/hero-workshop-keyframes.mjs
 *
 * Paste the output over everything below the "generated" line in that file.
 */
const r = (n) => Math.round(n * 100) / 100;
const kf = (name, frames) => `@keyframes ${name} {\n` + frames.map(([p, decl]) => `  ${r(p)}% { ${decl}; }`).join("\n") + "\n}\n";

/** The robot is drawn at this scale on the bed (see hero-workshop.tsx). */
const S = 0.72;
/** The robot's height in its own units, feet to antenna. */
const TALL = 158;
const PRINT_START = 3, PRINT_END = 36, PARK = 40;
const PASSES = 33; // one pass over the layer every 1% of the clock (0.12s)

/** How wide the robot is at a height above its feet: the width of the layer the head lays there. */
const halfWidth = (h) =>
  h <= 6 ? 35 : h <= 18 ? 30 : h <= 30 ? 50 : h <= 70 ? 66 : h <= 75 ? 50 : h <= 82 ? 12 : h <= 99 ? 38 : h <= 117 ? 44 : h <= 134 ? 38 : h <= 146 ? 2 : 6;

// the toolhead: from where it parks, across each layer edge to edge, and back to park
const PARK_X = 112;
const sweep = [[0, PARK_X]];
for (let i = 0; i <= PASSES; i++) {
  const p = PRINT_START + ((PRINT_END - PRINT_START) * i) / PASSES;
  const h = (TALL * Math.min(i, PASSES - 0.5)) / PASSES;
  sweep.push([p, (i % 2 ? 1 : -1) * halfWidth(h) * S]);
}
sweep.push([PARK, PARK_X], [100, PARK_X]);
const sweepKf = kf("vc-ws-sweep", sweep.map(([p, x]) => [p, `transform: translateX(${r(x)}px)`]));

// the robot, in its own units on the bed: still; steps toward us; hops down out
// of the chamber to the floor in front; walks off to the right; stands to wave
const FLOOR = 174; // from the lowered bed down to the floor in front of the machine
const OFF = 356; // from the middle of the bed to where it stands to wave
const bot = [[0, 0, 0, 1], [56, 0, 0, 1]];
const legL = [[0, 0], [56, 0]], legR = [[0, 0], [56, 0]];
const steps = (p0, p1, x0, x1, y0, y1, k0, k1) => {
  const n = Math.round(p1 - p0);
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    const up = i % 2 === 1 && i < n;
    bot.push([p0 + (p1 - p0) * f, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + (up ? -5 : 0), k0 + (k1 - k0) * f]);
    legL.push([p0 + (p1 - p0) * f, up ? -6 : 0]);
    legR.push([p0 + (p1 - p0) * f, up || i === n ? 0 : -6]);
  }
};
steps(56, 61, 0, 0, 0, 16, 1, 1.1);
bot.push([62.5, 6, -26, 1.16], [64, 12, FLOOR, 1.25]);
legL.push([64, 0]); legR.push([64, 0]);
steps(65, 78, 12, OFF, FLOOR, FLOOR, 1.25, 1.25);
bot.push([100, OFF, FLOOR, 1.25]);
legL.push([100, 0]); legR.push([100, 0]);
const botKf = kf("vc-ws-bot", bot.map(([p, x, y, k]) => [p, `transform: translate(${r(x)}px, ${r(y)}px) scale(${r(k)})`]));
const legLKf = kf("vc-ws-leg-l", legL.map(([p, y]) => [p, `transform: translateY(${y}px)`]));
const legRKf = kf("vc-ws-leg-r", legR.map(([p, y]) => [p, `transform: translateY(${y}px)`]));

// the wave: the arm swings up, waggles, comes down
const wave = [[0, 0], [79, 0], [80.5, -150]];
for (let p = 81.5, i = 0; p <= 85.5; p += 1, i++) wave.push([p, i % 2 ? -150 : -120]);
wave.push([87, 0], [100, 0]);
const waveKf = kf("vc-ws-wave", wave.map(([p, d]) => [p, `transform: rotate(${d}deg)`]));

process.stdout.write([sweepKf, botKf, legLKf, legRKf, waveKf].join("\n"));
