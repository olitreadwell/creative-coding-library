import type { Rng } from "@/lib/creative/random";

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Recursively splits `rect` into smaller rectangles.
 *
 * At each level the function picks a random split line (horizontal or vertical)
 * at a position between 25% and 75% of the current dimension. Both halves are
 * then split again until `depth` reaches 0, at which point the rectangle is
 * returned as a leaf.
 *
 * Passing the same `rng` (same seed) always produces the same layout.
 */
export function subdivide(rect: Rect, depth: number, rng: Rng): Rect[] {
  if (depth <= 0) return [rect];

  const splitHorizontal = rng() < 0.5;

  if (splitHorizontal) {
    const split = rect.h * (0.25 + rng() * 0.5);
    const top: Rect = { x: rect.x, y: rect.y, w: rect.w, h: split };
    const bottom: Rect = { x: rect.x, y: rect.y + split, w: rect.w, h: rect.h - split };
    return [...subdivide(top, depth - 1, rng), ...subdivide(bottom, depth - 1, rng)];
  } else {
    const split = rect.w * (0.25 + rng() * 0.5);
    const left: Rect = { x: rect.x, y: rect.y, w: split, h: rect.h };
    const right: Rect = { x: rect.x + split, y: rect.y, w: rect.w - split, h: rect.h };
    return [...subdivide(left, depth - 1, rng), ...subdivide(right, depth - 1, rng)];
  }
}
