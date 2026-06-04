/**
 * Pure boids simulation logic. No DOM imports — safe to run in any environment.
 *
 * Implements Craig Reynolds' three steering rules:
 *   - Separation: steer away from crowded neighbours
 *   - Alignment:  match the average heading of neighbours
 *   - Cohesion:   steer toward the average position of neighbours
 */

import type { Rng } from "@/lib/creative/random";
import { randRange } from "@/lib/creative/random";
import { clamp, wrap, TAU } from "@/lib/creative/math";

/** A single boid with position and velocity. */
export type Boid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

/** Tuning knobs for the three rules plus speed limits. */
export type BoidsOpts = {
  /** Radius within which a boid sees its neighbours. */
  perceptionRadius: number;
  /** Radius within which separation kicks in (must be <= perceptionRadius). */
  separationRadius: number;
  /** Weight for the separation force. */
  separationWeight: number;
  /** Weight for the alignment force. */
  alignmentWeight: number;
  /** Weight for the cohesion force. */
  cohesionWeight: number;
  /** Minimum speed (prevents stalling). */
  minSpeed: number;
  /** Maximum speed. */
  maxSpeed: number;
};

export const DEFAULT_OPTS: BoidsOpts = {
  perceptionRadius: 60,
  separationRadius: 20,
  separationWeight: 1.6,
  alignmentWeight: 1.0,
  cohesionWeight: 0.9,
  minSpeed: 1.5,
  maxSpeed: 3.5,
};

/**
 * Creates an initial flock of boids scattered randomly across the canvas.
 *
 * @param rng - Seeded RNG so the result is deterministic given the same seed.
 * @param count - Number of boids to create.
 * @param width - Canvas width in CSS pixels.
 * @param height - Canvas height in CSS pixels.
 * @returns Array of `count` boids with random positions and velocities.
 */
export function makeBoids(rng: Rng, count: number, width: number, height: number): Boid[] {
  const boids: Boid[] = [];
  for (let i = 0; i < count; i++) {
    const angle = randRange(rng, 0, TAU);
    const speed = randRange(rng, DEFAULT_OPTS.minSpeed, DEFAULT_OPTS.maxSpeed);
    boids.push({
      x: randRange(rng, 0, width),
      y: randRange(rng, 0, height),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return boids;
}

/**
 * Returns the vector magnitude of (dx, dy).
 */
function magnitude(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamps a velocity vector's magnitude into [minSpeed, maxSpeed].
 *
 * @param vx - x component of velocity.
 * @param vy - y component of velocity.
 * @param minSpeed - Lower speed bound.
 * @param maxSpeed - Upper speed bound.
 * @returns Clamped velocity { vx, vy }.
 */
function clampSpeed(
  vx: number,
  vy: number,
  minSpeed: number,
  maxSpeed: number,
): { vx: number; vy: number } {
  const spd = magnitude(vx, vy);
  if (spd === 0) {
    // Avoid division by zero; give the boid a small arbitrary push.
    return { vx: minSpeed, vy: 0 };
  }
  const clamped = clamp(spd, minSpeed, maxSpeed);
  const scale = clamped / spd;
  return { vx: vx * scale, vy: vy * scale };
}

/**
 * Advances the flock by one step, applying Reynolds' three rules.
 *
 * The function is pure: it does not mutate the input array and is deterministic
 * given the same inputs.
 *
 * @param boids - Current flock state.
 * @param opts - Steering parameters.
 * @param width - Canvas width (used for edge wrapping).
 * @param height - Canvas height (used for edge wrapping).
 * @returns A new array of boids after one simulation step.
 */
export function stepBoids(
  boids: readonly Boid[],
  opts: BoidsOpts,
  width: number,
  height: number,
): Boid[] {
  const {
    perceptionRadius,
    separationRadius,
    separationWeight,
    alignmentWeight,
    cohesionWeight,
    minSpeed,
    maxSpeed,
  } = opts;

  const r2 = perceptionRadius * perceptionRadius;
  const sep2 = separationRadius * separationRadius;

  return boids.map((b) => {
    // Accumulators for each rule.
    let sepX = 0;
    let sepY = 0;
    let alignVx = 0;
    let alignVy = 0;
    let cohX = 0;
    let cohY = 0;
    let neighbourCount = 0;
    let separatorCount = 0;

    for (const other of boids) {
      if (other === b) continue;

      // Compute shortest-path distance, accounting for toroidal wrapping.
      let dx = other.x - b.x;
      let dy = other.y - b.y;

      // Wrap delta for toroidal space.
      if (dx > width / 2) dx -= width;
      else if (dx < -width / 2) dx += width;
      if (dy > height / 2) dy -= height;
      else if (dy < -height / 2) dy += height;

      const d2 = dx * dx + dy * dy;
      if (d2 >= r2) continue;

      neighbourCount++;

      // Separation: accumulate a repulsion vector (pointing away from other).
      if (d2 < sep2 && d2 > 0) {
        // Weight by inverse distance so closer boids push harder.
        const dist = Math.sqrt(d2);
        sepX -= dx / dist;
        sepY -= dy / dist;
        separatorCount++;
      }

      // Alignment: accumulate neighbour velocities.
      alignVx += other.vx;
      alignVy += other.vy;

      // Cohesion: accumulate neighbour positions (relative to b).
      cohX += dx;
      cohY += dy;
    }

    let newVx = b.vx;
    let newVy = b.vy;

    if (neighbourCount > 0) {
      // Alignment: steer toward average velocity of neighbours.
      const invN = 1 / neighbourCount;
      newVx += (alignVx * invN - b.vx) * alignmentWeight * 0.05;
      newVy += (alignVy * invN - b.vy) * alignmentWeight * 0.05;

      // Cohesion: steer toward the average position of neighbours.
      newVx += cohX * invN * cohesionWeight * 0.001;
      newVy += cohY * invN * cohesionWeight * 0.001;
    }

    if (separatorCount > 0) {
      // Separation: apply accumulated repulsion.
      newVx += sepX * separationWeight * 0.05;
      newVy += sepY * separationWeight * 0.05;
    }

    // Clamp speed to [minSpeed, maxSpeed].
    const clamped = clampSpeed(newVx, newVy, minSpeed, maxSpeed);

    // Advance position and wrap at canvas edges.
    const newX = wrap(b.x + clamped.vx, 0, width);
    const newY = wrap(b.y + clamped.vy, 0, height);

    return { x: newX, y: newY, vx: clamped.vx, vy: clamped.vy };
  });
}
