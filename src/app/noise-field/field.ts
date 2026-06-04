import { TAU, wrap } from "@/lib/creative/math";
import type { PerlinNoise2D } from "@/lib/creative/noise";
import type { Rng } from "@/lib/creative/random";
import { randRange } from "@/lib/creative/random";

export type Particle = {
  x: number;
  y: number;
};

/**
 * Sample the flow field at (x, y) and return a direction angle in radians.
 * The * 2 expands the noise range so angles span more than one full rotation,
 * producing tighter, more varied spirals.
 */
export function flowAngle(perlin: PerlinNoise2D, x: number, y: number, scale: number): number {
  return perlin(x * scale, y * scale) * TAU * 2;
}

/**
 * Advance a particle one step along `angle` at the given speed, wrapping
 * within [0, width) and [0, height).
 */
export function stepParticle(
  p: Particle,
  angle: number,
  speed: number,
  width: number,
  height: number,
): Particle {
  const nx = wrap(p.x + Math.cos(angle) * speed, 0, width);
  const ny = wrap(p.y + Math.sin(angle) * speed, 0, height);
  return { x: nx, y: ny };
}

/**
 * Spawn `count` particles at uniformly random positions within the canvas.
 */
export function makeParticles(rng: Rng, count: number, width: number, height: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: randRange(rng, 0, width),
      y: randRange(rng, 0, height),
    });
  }
  return particles;
}
