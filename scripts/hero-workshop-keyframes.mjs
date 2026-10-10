#!/usr/bin/env node
/**
 * Generates the stepped and sampled keyframes at the bottom of
 * components/hero-workshop.css, all as percentages of the hero's 14s clock:
 *
 *   - the hotend's passes, one per layer, each as wide as the robot is at
 *     that height, and the belt that drives it
 *   - the robot arm's joints, solved from where its gripper has to be (two-link
 *     inverse kinematics; the wrist keeps the gripper hanging straight down)
 *   - the robot: its walk to the edge of the bed, the ride in the gripper (a
 *     damped pendulum hanging from the moving gripper), the hop, the wave and
 *     the walk off
 *
 *   node scripts/hero-workshop-keyframes.mjs
 *
 * Paste the output over everything below the "generated" line in that file.
 * The geometry here must match components/hero-workshop.tsx.
 */
const r2 = (n) => Math.round(n * 100) / 100;
const deg = (a) => (a * 180) / Math.PI;
const kf = (name, frames) =>
  `@keyframes ${name} {\n` + frames.map(([p, decl]) => `  ${r2(p)}% { ${decl}; }`).join("\n") + "\n}\n";
const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
const span = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const lerp = (a, b, v) => a + (b - a) * v;
const LOOP_S = 14;

// ------------------------------------------------------------------ geometry
/** The robot is drawn at this scale, standing at (RX, BED). */
const S = 0.78, RX = 210, BED = 410;
const TALL = 158; // feet to antenna, in the robot's own units
const GRIP = 140 * S; // the gripper takes it by the antenna stem, this far above its feet
const G0 = [RX, BED - GRIP]; // where that is while it stands where it was printed
/** The arm: shoulder pivot, two links, and the gripper hanging below the wrist. */
const SH = [468, 430], L1 = 130, L2 = 130, HANG = 30;
const REACH = L1 + L2;

// --------------------------------------------------------------- the print
const PRINT_END = 30; // the print runs 0-30% (4.2s), one pass per 1%
const PASSES = 30;
const PARK_X = -90;
/** How wide the robot is at a height above its feet: the layer the head lays there. */
const halfWidth = (h) =>
  h <= 6 ? 35 : h <= 18 ? 30 : h <= 30 ? 50 : h <= 70 ? 66 : h <= 75 ? 50 : h <= 82 ? 12 : h <= 99 ? 38 : h <= 117 ? 45 : h <= 134 ? 38 : h <= 146 ? 2 : 6;
const sweep = [];
for (let i = 0; i <= PASSES; i++) {
  const h = (TALL * Math.min(i, PASSES - 0.5)) / PASSES;
  sweep.push([(PRINT_END * i) / PASSES, (i % 2 ? 1 : -1) * halfWidth(h) * S]);
}
const x0 = sweep[0][1];
sweep.push([33, PARK_X], [86, PARK_X], [98, x0], [100, x0]);
const sweepKf = kf("vc-ws-sweep", sweep.map(([p, x]) => [p, `transform: translateX(${r2(x)}px)`]));
const beltKf = kf("vc-ws-belt", sweep.map(([p, x]) => [p, `stroke-dashoffset: ${r2(-x)}`]));

// ---------------------------------------------------- where the gripper goes
// The wrist point W; the gripper's jaws close HANG below it.
const idle = (p) => [400 + 5 * Math.sin((2 * Math.PI * p) / 25), 250 + 4 * Math.sin((2 * Math.PI * p) / 50 + 1)];
const WALK_TO = 80; // the robot walks this far right on the bed, to meet the arm
const PICK = [RX + WALK_TO, G0[1] - HANG];
const ABOVE = [PICK[0], PICK[1] - 45];
const LIFT = [300, 235];
const DROP = [600, BED + 80 - GRIP - HANG]; // the robot's feet on the floor at y 490
const OVER = [600, 300];
const polar = (b, r) => [SH[0] + r * Math.cos(b), SH[1] + r * Math.sin(b)];
const toPolar = ([x, y]) => [Math.atan2(y - SH[1], x - SH[0]), Math.hypot(x - SH[0], y - SH[1])];
/** Over the top of the arm's reach, from a to b: at the top it is at full stretch. */
const overTop = (a, b, v) => {
  const [ba, ra] = toPolar(a);
  const [bb, rb] = toPolar(b);
  const top = -Math.PI / 2;
  const total = Math.abs(top - ba) + Math.abs(bb - top);
  const s = smooth(v) * total;
  const first = Math.abs(top - ba);
  if (s <= first) return polar(ba + Math.sign(top - ba) * s, lerp(ra, REACH - 0.01, smooth(s / first)));
  const q = (s - first) / Math.abs(bb - top);
  return polar(top + Math.sign(bb - top) * (s - first), lerp(REACH - 0.01, rb, smooth(q)));
};
const line = (a, b, v) => [lerp(a[0], b[0], smooth(v)), lerp(a[1], b[1], smooth(v))];
const wrist = (p) => {
  if (p < 40 || p >= 80) return idle(p);
  if (p < 47) return line(idle(40), ABOVE, span(p, 40, 47));
  if (p < 50) return line(ABOVE, PICK, span(p, 47, 50));
  if (p < 53) return line(PICK, LIFT, span(p, 50, 53));
  if (p < 63) return overTop(LIFT, OVER, span(p, 53, 63));
  if (p < 66) return line(OVER, DROP, span(p, 63, 66));
  if (p < 68) return line(DROP, OVER, span(p, 66, 68));
  return overTop(OVER, idle(80), span(p, 68, 80));
};

/** Two-link IK, elbow up: on the left of the shoulder the elbow bends one way, on the right the other. */
const solve = ([x, y]) => {
  const dx = x - SH[0], dy = y - SH[1];
  const d = Math.min(Math.hypot(dx, dy), REACH - 1e-6);
  const b = Math.atan2(dy, dx);
  const alpha = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const a1 = b < -Math.PI / 2 ? b + alpha : b - alpha;
  const e = [SH[0] + L1 * Math.cos(a1), SH[1] + L1 * Math.sin(a1)];
  const a2 = Math.atan2(y - e[1], x - e[0]);
  // the links are drawn pointing straight up; the wrist undoes the rest so the gripper hangs
  return { shoulder: deg(a1) + 90, elbow: deg(a2 - a1), wrist: -(deg(a2) + 90) };
};
const unwrap = (prev, v) => {
  if (prev === undefined) return v;
  while (v - prev > 180) v -= 360;
  while (v - prev < -180) v += 360;
  return v;
};
const armMarks = [];
for (let p = 0; p < 40; p += 2) armMarks.push(p);
for (let p = 40; p < 80; p += 0.25) armMarks.push(p);
for (let p = 80; p <= 100; p += 2) armMarks.push(p);
const arm = { shoulder: [], elbow: [], wrist: [] };
const last = {};
for (const p of armMarks) {
  const j = solve(wrist(p));
  for (const k of Object.keys(arm)) {
    last[k] = unwrap(last[k], j[k]);
    arm[k].push([p, `transform: rotate(${r2(last[k])}deg)`]);
  }
}
const armKf = Object.entries(arm).map(([k, f]) => kf(`vc-ws-${k}`, f)).join("\n");

// the jaws: open, shut on the antenna, open to let go, a clap of goodbye
const OPEN = 18;
const jaw = [[0, OPEN], [49.6, OPEN], [50.4, 0], [65.8, 0], [66.8, OPEN]];
for (let p = 71, i = 0; p <= 74.2; p += 0.8, i++) jaw.push([p, i % 2 ? OPEN : 2]);
jaw.push([75, OPEN], [100, OPEN]);
const jawA = kf("vc-ws-jaw-a", jaw.map(([p, a]) => [p, `transform: rotate(${a}deg)`]));
const jawB = kf("vc-ws-jaw-b", jaw.map(([p, a]) => [p, `transform: rotate(${-a}deg)`]));

// ------------------------------------------------------------------ the robot
// world-space offset from where it was printed, and its swing about the grip point
const bot = [[0, 0, 0, 0], [38, 0, 0, 0]];
const legL = [[0, 0], [38, 0]], legR = [[0, 0], [38, 0]];
const steps = (p0, p1, xa, xb, y, n) => {
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    const up = i % 2 === 1 && i < n;
    const p = lerp(p0, p1, f);
    bot.push([p, lerp(xa, xb, f), y + (up ? -3 : 0), 0]);
    legL.push([p, up ? -6 : 0]);
    legR.push([p, up || i === n ? 0 : -6]);
  }
};
steps(38, 44, 0, WALK_TO, 0, 6);
bot.push([50, WALK_TO, 0, 0]);

// the ride: a damped pendulum from the moving grip point
{
  const at = (t) => wrist(t / (LOOP_S / 100));
  const acc = (t) => {
    const h = 0.004;
    const a = at(t - h), b = at(t), c = at(t + h);
    return [(a[0] - 2 * b[0] + c[0]) / (h * h), (a[1] - 2 * b[1] + c[1]) / (h * h)];
  };
  const L = 58, g = 2900, damp = 3.2;
  let th = 0, om = 0;
  const t0 = 0.5 * LOOP_S, t1 = 0.66 * LOOP_S, dt = 0.001;
  let next = 50.25;
  for (let t = t0; t <= t1 + 1e-9; t += dt) {
    const [ax, ay] = acc(t);
    const al = (-g * Math.sin(th) - ax * Math.cos(th) + ay * Math.sin(th)) / L - damp * om;
    om += al * dt;
    th += om * dt;
    const p = t / (LOOP_S / 100);
    if (p >= next - 1e-9) {
      const w = at(t);
      const settle = 1 - smooth(span(p, 63, 66));
      const rot = Math.max(-14, Math.min(14, -0.75 * deg(th))) * settle;
      bot.push([p, w[0] - G0[0], w[1] + HANG - G0[1], rot]);
      // little legs kick while it hangs
      legL.push([p, Math.round(p * 2) % 2 ? -5 : 0]);
      legR.push([p, Math.round(p * 2) % 2 ? 0 : -5]);
      next += 0.25;
    }
  }
}
const DOWN = [DROP[0] - G0[0], 80];
bot.push([66, DOWN[0], DOWN[1], 0]);
legL.push([66, 0]); legR.push([66, 0]);
// a hop for joy
bot.push([66.8, DOWN[0], DOWN[1] - 16, 0], [67.6, DOWN[0], DOWN[1], 0], [75, DOWN[0], DOWN[1], 0]);
legL.push([75, 0]); legR.push([75, 0]);
// and off it goes
steps(75, 84, DOWN[0], DOWN[0] + 150, DOWN[1], 9);
bot.push([100, 0, 0, 0]);
legL.push([100, 0]); legR.push([100, 0]);
const botKf = kf("vc-ws-bot", bot.map(([p, x, y, a]) => [p, `transform: translate(${r2(x)}px, ${r2(y)}px) rotate(${r2(a)}deg)`]));
const legLKf = kf("vc-ws-leg-l", legL.map(([p, y]) => [p, `transform: translateY(${y}px)`]));
const legRKf = kf("vc-ws-leg-r", legR.map(([p, y]) => [p, `transform: translateY(${y}px)`]));

// the robot waves back at the arm
const wave = [[0, 0], [68.6, 0], [69.4, -150]];
for (let p = 70.2, i = 0; p <= 73.4; p += 0.8, i++) wave.push([p, i % 2 ? -150 : -118]);
wave.push([74.6, 0], [100, 0]);
const waveKf = kf("vc-ws-wave", wave.map(([p, d]) => [p, `transform: rotate(${d}deg)`]));

// ---------------------------------------------------------- reduced motion
const rest = solve(idle(0));
const still = `@media (prefers-reduced-motion: reduce) {
  .vc-arm-shoulder { transform: rotate(${r2(rest.shoulder)}deg); }
  .vc-arm-elbow { transform: rotate(${r2(rest.elbow)}deg); }
  .vc-arm-wrist { transform: rotate(${r2(rest.wrist)}deg); }
  .vc-jaw-a { transform: rotate(${OPEN}deg); }
  .vc-jaw-b { transform: rotate(${-OPEN}deg); }
}
`;

process.stdout.write([sweepKf, beltKf, armKf, jawA, jawB, botKf, legLKf, legRKf, waveKf, still].join("\n"));
