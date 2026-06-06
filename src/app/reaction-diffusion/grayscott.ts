/**
 * Pure Gray-Scott reaction-diffusion logic. No DOM imports — safe to run in
 * any environment (browser, Node, Vitest).
 *
 * The Gray-Scott model simulates two virtual chemicals, A and B, on a 2D grid.
 * At each step, both chemicals diffuse (spread to neighbours) and react:
 *   A is consumed when it meets B, producing more B.
 *   B decays at a fixed kill rate.
 *   A is replenished at a fixed feed rate.
 *
 * Reference: Gray & Scott (1984), "Autocatalytic reactions in the isothermal,
 * continuous stirred tank reactor". Chemical Engineering Science, 39(6),
 * 1087–1097. See also https://en.wikipedia.org/wiki/Reaction–diffusion_system
 */

import { makeRng } from "@/lib/creative/random";
import { clamp } from "@/lib/creative/math";

/** Parameters that control pattern morphology. */
export type GrayScottParams = {
  /** Diffusion rate of chemical A (typically ~1.0). */
  dA: number;
  /** Diffusion rate of chemical B (typically ~0.5). */
  dB: number;
  /** Feed rate — how fast A is replenished (range roughly 0.01–0.08). */
  feed: number;
  /** Kill rate — how fast B is removed (range roughly 0.04–0.07). */
  kill: number;
};

/** A snapshot of the two-chemical grid. */
export type GrayScottGrid = {
  /** Concentration of chemical A, row-major Float32Array of length width*height. */
  a: Float32Array;
  /** Concentration of chemical B, row-major Float32Array of length width*height. */
  b: Float32Array;
  width: number;
  height: number;
};

/**
 * Preset parameters that produce interesting spot/stripe patterns.
 * These values are from Pearson's 1993 classification of Gray-Scott patterns.
 */
export const PRESETS = {
  /** Mitosis-like spots. */
  spots: { dA: 1.0, dB: 0.5, feed: 0.055, kill: 0.062 },
  /** Fingerprint-like stripes. */
  stripes: { dA: 1.0, dB: 0.5, feed: 0.04, kill: 0.06 },
  /** Moving solitons (pulsing blobs). */
  solitons: { dA: 1.0, dB: 0.5, feed: 0.03, kill: 0.062 },
} satisfies Record<string, GrayScottParams>;

/** Default to spot morphology. */
export const DEFAULT_PARAMS: GrayScottParams = PRESETS.spots;

/**
 * Number of seeded B-patches to scatter across the initial grid.
 * A small square of B is enough to seed the reaction.
 */
const SEED_PATCH_COUNT = 5;

/** Half-side of each seed patch in cells. */
const SEED_PATCH_RADIUS = 3;

/**
 * Creates an initial grid with A=1 everywhere and B=0 everywhere, then
 * seeds a few small patches of B to kick off the reaction.
 *
 * @param width - Grid width in cells
 * @param height - Grid height in cells
 * @param seed - Deterministic seed; same seed always produces the same layout
 * @returns Initial { a, b, width, height }
 */
export function makeGrid(width: number, height: number, seed: number | string): GrayScottGrid {
  const size = width * height;
  const a = new Float32Array(size).fill(1.0);
  const b = new Float32Array(size);

  const rng = makeRng(seed);

  for (let p = 0; p < SEED_PATCH_COUNT; p++) {
    // Pick a random center, keeping patches away from the very edge.
    const cx = Math.floor(rng() * (width - SEED_PATCH_RADIUS * 2) + SEED_PATCH_RADIUS);
    const cy = Math.floor(rng() * (height - SEED_PATCH_RADIUS * 2) + SEED_PATCH_RADIUS);

    for (let dy = -SEED_PATCH_RADIUS; dy <= SEED_PATCH_RADIUS; dy++) {
      for (let dx = -SEED_PATCH_RADIUS; dx <= SEED_PATCH_RADIUS; dx++) {
        const gx = cx + dx;
        const gy = cy + dy;
        if (gx < 0 || gx >= width || gy < 0 || gy >= height) continue;
        const idx = gy * width + gx;
        a[idx] = 0.0;
        b[idx] = 1.0;
      }
    }
  }

  return { a, b, width, height };
}

/**
 * Computes a toroidal (wrapping) 3x3 Laplacian for cell (x, y) in the grid.
 * The Laplacian approximates diffusion: positive where concentration is below
 * the local average, negative where it is above.
 *
 * Weights: centre = -1, cardinal neighbours = 0.2, diagonal neighbours = 0.05.
 * These sum to zero, which is required for a valid discrete Laplacian.
 *
 * @param grid - The Float32Array to sample from
 * @param x - Column index
 * @param y - Row index
 * @param width - Grid width
 * @param height - Grid height
 * @returns Laplacian value at (x, y)
 */
function laplacian(
  grid: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  // Toroidal wrap helpers.
  const xL = (x - 1 + width) % width;
  const xR = (x + 1) % width;
  const yU = (y - 1 + height) % height;
  const yD = (y + 1) % height;

  const center = grid[y * width + x] ?? 0;
  const top = grid[yU * width + x] ?? 0;
  const bot = grid[yD * width + x] ?? 0;
  const left = grid[y * width + xL] ?? 0;
  const right = grid[y * width + xR] ?? 0;
  const tl = grid[yU * width + xL] ?? 0;
  const tr = grid[yU * width + xR] ?? 0;
  const bl = grid[yD * width + xL] ?? 0;
  const br = grid[yD * width + xR] ?? 0;

  return -1.0 * center + 0.2 * (top + bot + left + right) + 0.05 * (tl + tr + bl + br);
}

/**
 * Advances the Gray-Scott simulation by one time step.
 *
 * The update equations are:
 *   A' = A + (dA * lapA - A*B*B + feed*(1-A)) * dt
 *   B' = B + (dB * lapB + A*B*B - (kill+feed)*B) * dt
 *
 * Both output arrays are clamped to [0, 1] so floating-point drift cannot
 * accumulate into nonsensical concentrations.
 *
 * @param a - Current A concentrations (not mutated)
 * @param b - Current B concentrations (not mutated)
 * @param width - Grid width
 * @param height - Grid height
 * @param params - Reaction parameters
 * @param dt - Time step (default 1.0; smaller values are more stable)
 * @returns New { a, b } buffers for the next frame
 */
export function step(
  a: Float32Array,
  b: Float32Array,
  width: number,
  height: number,
  params: GrayScottParams,
  dt = 1.0,
): { a: Float32Array; b: Float32Array } {
  const { dA, dB, feed, kill } = params;
  const nextA = new Float32Array(a.length);
  const nextB = new Float32Array(b.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const aVal = a[idx] ?? 0;
      const bVal = b[idx] ?? 0;

      const lapA = laplacian(a, x, y, width, height);
      const lapB = laplacian(b, x, y, width, height);

      // Gray-Scott reaction term.
      const reaction = aVal * bVal * bVal;

      nextA[idx] = clamp(aVal + (dA * lapA - reaction + feed * (1.0 - aVal)) * dt, 0.0, 1.0);
      nextB[idx] = clamp(bVal + (dB * lapB + reaction - (kill + feed) * bVal) * dt, 0.0, 1.0);
    }
  }

  return { a: nextA, b: nextB };
}
