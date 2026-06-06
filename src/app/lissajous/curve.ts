import { TAU } from "@/lib/creative/math";

export type LissajousParams = {
  a: number;
  b: number;
  A: number;
  B: number;
  phase: number;
  decay?: number;
};

export type Point = { x: number; y: number };

/**
 * Evaluate a decaying Lissajous / harmonograph point at parameter `s`.
 *
 * x(s) = A * sin(a*s + phase) * exp(-decay * s)
 * y(s) = B * sin(b*s)         * exp(-decay * s)
 *
 * @param s        - Curve parameter (radians; typically 0 .. many * TAU)
 * @param params   - Frequency, amplitude, phase, and optional decay rate
 * @returns        - Canvas-relative {x, y} in the amplitude coordinate space
 */
export function lissajousPoint(s: number, params: LissajousParams): Point {
  const { a, b, A, B, phase, decay = 0 } = params;
  const envelope = decay > 0 ? Math.exp(-decay * s) : 1;
  return {
    x: A * Math.sin(a * s + phase) * envelope,
    y: B * Math.sin(b * s) * envelope,
  };
}

/**
 * Sample the Lissajous curve uniformly over [0, steps * TAU / min(a,b)].
 *
 * The sampling window is long enough that for any integer frequency ratio the
 * full pattern closes (or has clearly decayed). With decay=0 a window of
 * `steps` points over [0, TAU] closes for ratios whose LCM divides 2pi —
 * we therefore use [0, steps] in raw parameter units so callers control density.
 *
 * @param params - Curve parameters
 * @param steps  - Number of sample points returned
 * @returns      - Array of exactly `steps` points
 */
export function samplePath(params: LissajousParams, steps: number): Point[] {
  if (steps <= 0) return [];
  const points: Point[] = [];
  const tMax = TAU * 10;
  const divisor = steps > 1 ? steps - 1 : 1;
  for (let i = 0; i < steps; i++) {
    const s = (i / divisor) * tMax;
    points.push(lissajousPoint(s, params));
  }
  return points;
}
