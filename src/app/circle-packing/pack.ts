import type { Rng } from "@/lib/creative/random";
import { randRange } from "@/lib/creative/random";

export type Circle = { x: number; y: number; r: number };

export type PackOptions = {
  width: number;
  height: number;
  attempts: number;
  minRadius: number;
  maxRadius: number;
  padding: number;
};

/**
 * The largest radius a circle centered at (x, y) can take without crossing a
 * wall or overlapping any existing circle. Capped at `maxRadius`.
 */
export function maxRadiusAt(
  x: number,
  y: number,
  width: number,
  height: number,
  circles: readonly Circle[],
  maxRadius: number,
): number {
  let r = Math.min(x, y, width - x, height - y);
  for (const c of circles) {
    const gap = Math.hypot(x - c.x, y - c.y) - c.r;
    if (gap < r) r = gap;
  }
  return Math.min(r, maxRadius);
}

/**
 * Greedy random circle packing. For each of `attempts` tries, drop a point at a
 * random spot and grow it to the largest radius that touches nothing. Keep it
 * only if that radius clears `minRadius` after `padding` is removed. Earlier
 * circles win the space, so later ones fill the gaps between them.
 *
 * Deterministic for a given seeded `rng`: the same seed always packs the same.
 */
export function packCircles(rng: Rng, opts: PackOptions): Circle[] {
  const { width, height, attempts, minRadius, maxRadius, padding } = opts;
  const circles: Circle[] = [];
  for (let i = 0; i < attempts; i++) {
    const x = randRange(rng, 0, width);
    const y = randRange(rng, 0, height);
    const r = maxRadiusAt(x, y, width, height, circles, maxRadius) - padding;
    if (r >= minRadius) circles.push({ x, y, r });
  }
  return circles;
}
