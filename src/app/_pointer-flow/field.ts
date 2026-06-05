/**
 * Balloon model for the Pointer Flow sketch.
 *
 * Exports the data types, factory functions, physics step, and drawing helper
 * for the blobby-balloon simulation. Imported by the play page and tested in
 * field.test.ts.
 */

import { clamp, TAU } from "@/lib/creative/math";
import { makeRng, randRange, randInt } from "@/lib/creative/random";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of perimeter points used to construct each balloon's wobbly path. */
const WOBBLE_POINTS = 20;

/** Soft-repulsion radius between neighboring balloons (CSS px). */
const SEPARATION_RADIUS = 80;

/** Per-frame velocity friction multiplier. */
const FRICTION = 0.82;

/** Spring constant for the squash/stretch deformation (1/s²). */
const SPRING_K = 18;

/** Damping coefficient for the squash spring (1/s). */
const SPRING_DAMP = 6;

/** Minimum un-deformed balloon radius (CSS px). */
export const MIN_RADIUS = 28;

/** Maximum un-deformed balloon radius (CSS px). */
export const MAX_RADIUS = 70;

/** Maximum shockwave age in seconds before the ring is discarded. */
const SHOCKWAVE_MAX_AGE = 1.4;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Balloon = {
  /** Center position in CSS pixels. */
  x: number;
  y: number;
  /** Velocity in CSS pixels per second. */
  vx: number;
  vy: number;
  /** Base (un-deformed) radius in CSS pixels. */
  radius: number;
  /** Index into the cbColor palette. */
  colorIdx: number;
  /** Wobble phase offset so each balloon has a unique starting shape. */
  wobblePhase: number;
  /** Wobble oscillation speed in radians per second. */
  wobbleSpeed: number;
  /** Squash/stretch scale: 1 = normal, <1 = squashed, >1 = stretched. */
  squash: number;
  /** Squash spring velocity (change in squash per second). */
  squashV: number;
};

export type Shockwave = {
  /** Click origin in CSS pixels. */
  x: number;
  y: number;
  /** Current expanded radius of the ring in CSS pixels. */
  radius: number;
  /** Expansion speed in CSS pixels per second. */
  speed: number;
  /** User-controlled strength multiplier (1–10). */
  strength: number;
  /** Time since the shockwave was emitted in seconds. */
  age: number;
};

export type FieldOptions = {
  count: number;
  width: number;
  height: number;
  seed?: number | string;
};

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

/**
 * Creates a set of balloons with randomised positions, sizes, and palette
 * indices. Passing the same seed always produces the same layout.
 *
 * @param options - Canvas dimensions, balloon count, and optional PRNG seed.
 * @returns Array of fresh Balloon objects.
 */
export function makeBalloons({
  count,
  width,
  height,
  seed = "pointer-flow-balloons",
}: FieldOptions): Balloon[] {
  const rng = makeRng(seed);
  return Array.from({ length: count }, () => ({
    x: randRange(rng, MAX_RADIUS, width - MAX_RADIUS),
    y: randRange(rng, MAX_RADIUS, height - MAX_RADIUS),
    vx: randRange(rng, -18, 18),
    vy: randRange(rng, -18, 18),
    radius: randRange(rng, MIN_RADIUS, MAX_RADIUS),
    colorIdx: randInt(rng, 0, 6),
    wobblePhase: randRange(rng, 0, TAU),
    wobbleSpeed: randRange(rng, 0.8, 1.6),
    squash: 1,
    squashV: 0,
  }));
}

/**
 * Creates a new Shockwave centred at (x, y).
 *
 * @param x          - Click X position in CSS pixels.
 * @param y          - Click Y position in CSS pixels.
 * @param strength   - User-controlled strength (1–10).
 * @param canvasSize - Larger of canvas width/height, used to set ring speed.
 * @returns A fresh Shockwave object.
 */
export function makeShockwave(
  x: number,
  y: number,
  strength: number,
  canvasSize: number,
): Shockwave {
  return {
    x,
    y,
    radius: 0,
    speed: canvasSize * 0.55,
    strength,
    age: 0,
  };
}

// ---------------------------------------------------------------------------
// Pure physics helpers
// ---------------------------------------------------------------------------

/**
 * Computes the radial impulse magnitude delivered to a balloon when a
 * shockwave ring passes through it.
 *
 * The ring pushes hardest when its leading edge aligns with the balloon center
 * (delta = 0) and falls off with a Gaussian envelope of width `halfWidth`.
 * Returns 0 when the ring has not yet reached or has fully passed the balloon.
 *
 * @param distFromOrigin - Distance from click origin to balloon center (px).
 * @param ringRadius     - Current ring expanded radius (px).
 * @param strength       - User-controlled strength multiplier (1–10).
 * @param halfWidth      - Gaussian envelope half-width (px). Default 90.
 * @returns Non-negative impulse magnitude in CSS px/s.
 */
export function shockwaveImpulse(
  distFromOrigin: number,
  ringRadius: number,
  strength: number,
  halfWidth = 90,
): number {
  const delta = ringRadius - distFromOrigin;
  if (delta < -halfWidth || delta > halfWidth * 0.4) return 0;
  const t = delta / halfWidth;
  const envelope = Math.exp(-(t * t) * 3);
  return envelope * strength * 420;
}

// ---------------------------------------------------------------------------
// Step functions (mutate in place)
// ---------------------------------------------------------------------------

/**
 * Advances a single balloon by `dt` seconds.
 *
 * Applies cursor attract/repel force, shockwave impulses, soft neighbor
 * separation, friction, speed cap, boundary bounce, and squash spring update.
 *
 * @param b          - Balloon to update (mutated in place).
 * @param pointer    - Current cursor position in CSS px, or null if off-canvas.
 * @param shockwaves - Active shockwave rings.
 * @param neighbors  - All other balloons (used for soft separation).
 * @param mode       - Whether the cursor attracts or repels balloons.
 * @param strength   - User-controlled interaction strength (1–10).
 * @param dt         - Frame delta time in seconds.
 * @param width      - Canvas CSS width.
 * @param height     - Canvas CSS height.
 */
export function stepBalloon(
  b: Balloon,
  pointer: { x: number; y: number } | null,
  shockwaves: readonly Shockwave[],
  neighbors: readonly Balloon[],
  mode: "attract" | "repel",
  strength: number,
  dt: number,
  width: number,
  height: number,
): void {
  const maxSpeed = 240 + strength * 60;

  // Cursor force: attract pulls toward cursor, repel pushes away.
  if (pointer !== null) {
    const dx = pointer.x - b.x;
    const dy = pointer.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 1;
    const force = (strength * 80) / (dist * 0.4 + 50);
    const sign = mode === "attract" ? 1 : -1;
    b.vx += sign * (dx / dist) * force * dt;
    b.vy += sign * (dy / dist) * force * dt;
  }

  // Shockwave impulse: apply outward push as the ring sweeps through.
  let hitByShockwave = false;
  for (const sw of shockwaves) {
    const dx = b.x - sw.x;
    const dy = b.y - sw.y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 1;
    const imp = shockwaveImpulse(dist, sw.radius, sw.strength);
    if (imp > 0) {
      b.vx += (dx / dist) * imp * dt;
      b.vy += (dy / dist) * imp * dt;
      hitByShockwave = true;
    }
  }
  if (hitByShockwave) {
    // Kick the squash spring to compress the balloon visibly.
    b.squashV += -0.6;
  }

  // Soft neighbor separation: prevents balloons from piling on each other.
  for (const n of neighbors) {
    if (n === b) continue;
    const dx = b.x - n.x;
    const dy = b.y - n.y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 1;
    if (dist < SEPARATION_RADIUS) {
      const push = ((SEPARATION_RADIUS - dist) / SEPARATION_RADIUS) * 30;
      b.vx += (dx / dist) * push * dt;
      b.vy += (dy / dist) * push * dt;
    }
  }

  // Friction and speed cap.
  b.vx *= FRICTION;
  b.vy *= FRICTION;
  const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  if (speed > maxSpeed) {
    b.vx = (b.vx / speed) * maxSpeed;
    b.vy = (b.vy / speed) * maxSpeed;
  }

  // Integrate position.
  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // Boundary bounce with a margin so the balloon stays fully on screen.
  const margin = b.radius * 0.9;
  b.x = clamp(b.x, margin, width - margin);
  b.y = clamp(b.y, margin, height - margin);
  if (b.x <= margin || b.x >= width - margin) b.vx *= -0.6;
  if (b.y <= margin || b.y >= height - margin) b.vy *= -0.6;

  // Squash spring: restores squash toward 1 after a shockwave hit.
  const springForce = -SPRING_K * (b.squash - 1) - SPRING_DAMP * b.squashV;
  b.squashV += springForce * dt;
  b.squash = clamp(b.squash + b.squashV * dt, 0.35, 1.65);
}

/**
 * Advances all shockwaves by `dt` seconds, expanding their radii and removing
 * any that have aged out.
 *
 * @param waves - Current list of active shockwaves.
 * @param dt    - Frame delta time in seconds.
 * @returns New array with updated and filtered shockwaves.
 */
export function stepShockwaves(waves: Shockwave[], dt: number): Shockwave[] {
  return waves
    .map((w) => ({ ...w, radius: w.radius + w.speed * dt, age: w.age + dt }))
    .filter((w) => w.age < SHOCKWAVE_MAX_AGE);
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

/**
 * Draws a single balloon on `ctx` as a smoothly closed wobbly path with a
 * soft specular highlight.
 *
 * The balloon outline is a ring of `WOBBLE_POINTS` points connected via
 * quadratic bezier curves. Each point's radial distance is offset by a sine
 * function, giving an organic wobbly silhouette. The squash value deforms the
 * ellipse so a shockwave hit visibly compresses then springs back.
 *
 * @param ctx    - Canvas 2D context (transform already set to CSS-px scale).
 * @param b      - Balloon to draw.
 * @param color  - CSS fill color string.
 * @param time   - Elapsed time in seconds (drives wobble animation).
 * @param isDark - True when the active theme is dark.
 */
export function drawBalloon(
  ctx: CanvasRenderingContext2D,
  b: Balloon,
  color: string,
  time: number,
  isDark: boolean,
): void {
  const pts: [number, number][] = [];
  const wobbleAmp = b.radius * 0.09;

  for (let i = 0; i < WOBBLE_POINTS; i++) {
    const angle = (i / WOBBLE_POINTS) * TAU;
    const wobble =
      wobbleAmp * Math.sin(3 * angle + b.wobblePhase + time * b.wobbleSpeed) * b.squash;
    const r = b.radius + wobble;
    // Squash deforms the ellipse: compress Y, compensate with wider X.
    const px = b.x + Math.cos(angle) * r * (2 - b.squash);
    const py = b.y + Math.sin(angle) * r * b.squash;
    pts.push([px, py]);
  }

  // Smooth closed curve via quadratic bezier through midpoints between pts.
  ctx.beginPath();
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last) return;
  ctx.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    if (!curr || !next) continue;
    ctx.quadraticCurveTo(curr[0], curr[1], (curr[0] + next[0]) / 2, (curr[1] + next[1]) / 2);
  }
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.82;
  ctx.fill();

  // Specular highlight: small bright radial gradient near the top-left.
  const hlR = b.radius * 0.28;
  const hlX = b.x - b.radius * 0.28;
  const hlY = b.y - b.radius * 0.3;
  const grad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
  grad.addColorStop(0, isDark ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.72)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.globalAlpha = 1;
  ctx.fill();
}
