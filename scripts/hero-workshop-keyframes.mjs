#!/usr/bin/env node
/**
 * Generates the stepped keyframes at the bottom of components/hero-workshop.css:
 * the hotend sweep and its belt, the robot's walk and legs, and the arm's wave,
 * all as percentages of the workshop's shared 14s clock.
 *
 *   node scripts/hero-workshop-keyframes.mjs
 *
 * Paste the output over everything below the "generated" line in that file.
 */
const r = (n) => Math.round(n * 100) / 100;
const kf = (name, frames) => `@keyframes ${name} {\n` + frames.map(([p, decl]) => `  ${r(p)}% { ${decl}; }`).join("\n") + "\n}\n";

const PRINT_END = 50, PARK = 53;
const SWEEP = 52, HALF = 4; // hotend: ±52 units, a pass every 4% (0.56s)

// hotend sweep and its belt, only while printing; parks centre after
const sweep = [];
for (let p = 0, i = 0; p < PRINT_END; p += HALF, i++) sweep.push([p, i % 2 ? SWEEP : -SWEEP]);
sweep.push([PRINT_END, sweep.length % 2 ? SWEEP : -SWEEP], [PARK, 0], [100, 0]);
const sweepKf = kf("vc-ws-sweep", sweep.map(([p, x]) => [p, `transform: translateX(${x}px)`]));
const beltKf = kf("vc-ws-belt", sweep.map(([p, x]) => [p, `stroke-dashoffset: ${-x}`]));

// the robot: still, hop, walk the bed, jump down, walk the floor, gone
const bot = [[0, 0, 0], [58, 0, 0], [59, 0, -12], [60, 0, 0]];
const legL = [[0, 0], [60, 0]], legR = [[0, 0], [60, 0]];
const walk = (p0, p1, x0, x1, y) => {
  const steps = Math.round(p1 - p0);
  for (let i = 1; i <= steps; i++) {
    const p = p0 + ((p1 - p0) * i) / steps;
    const up = i % 2 === 1;
    bot.push([p, x0 + ((x1 - x0) * i) / steps, y + (up ? -4 : 0)]);
    legL.push([p, up ? -5 : 0]);
    legR.push([p, up ? 0 : -5]);
  }
};
walk(60, 70, 0, 170, 0);
bot.push([71.5, 196, -30], [73, 222, 76]);
legL.push([73, 0]); legR.push([73, 0]);
walk(73, 86, 222, 440, 76);
bot.push([100, 0, 0]);
legL.push([100, 0]); legR.push([100, 0]);
const botKf = kf("vc-ws-bot", bot.map(([p, x, y]) => [p, `transform: translate(${r(x)}px, ${y}px)`]));
const legLKf = kf("vc-ws-leg-l", legL.map(([p, y]) => [p, `transform: translateY(${y}px)`]));
const legRKf = kf("vc-ws-leg-r", legR.map(([p, y]) => [p, `transform: translateY(${y}px)`]));

// the arm: a slow idle sway, then it waves the robot out as it passes
const shoulder = [[0, -4], [25, 4], [50, -4], [66, 2], [72, -14], [82, -14], [90, -4], [100, -4]];
const elbow = [[0, 6], [25, -8], [50, 6], [66, 2], [72, -40]];
for (let p = 73, i = 0; p <= 81; p += 1, i++) elbow.push([p, i % 2 ? -40 : -28]);
elbow.push([82, -36], [90, 6], [100, 6]);
const jawA = [[0, 0], [12, 12], [24, 0], [36, 12], [48, 0], [60, 10], [72, 0]];
for (let p = 73, i = 0; p <= 81; p += 1, i++) jawA.push([p, i % 2 ? 0 : 18]);
jawA.push([84, 0], [92, 10], [100, 0]);
const shKf = kf("vc-ws-shoulder", shoulder.map(([p, d]) => [p, `transform: rotate(${d}deg)`]));
const elKf = kf("vc-ws-elbow", elbow.map(([p, d]) => [p, `transform: rotate(${d}deg)`]));
const jaKf = kf("vc-ws-jaw-a", jawA.map(([p, d]) => [p, `transform: rotate(${d}deg)`]));
const jbKf = kf("vc-ws-jaw-b", jawA.map(([p, d]) => [p, `transform: rotate(${-d}deg)`]));

process.stdout.write([sweepKf, beltKf, botKf, legLKf, legRKf, shKf, elKf, jaKf, jbKf].join("\n"));
