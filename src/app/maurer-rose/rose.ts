import { TAU } from "@/lib/creative/math";

export type Point = { x: number; y: number };

const DEG_TO_RAD = Math.PI / 180;

/**
 * A point on the rose curve r = sin(n * theta), mapped to cartesian space and
 * scaled by `radius`. The rose is a polar curve: the distance from the center
 * rises and falls as a sine wave while the angle sweeps around.
 */
export function rosePoint(thetaRad: number, n: number, radius: number): Point {
  const r = Math.sin(n * thetaRad) * radius;
  return { x: r * Math.cos(thetaRad), y: r * Math.sin(thetaRad) };
}

/**
 * The Maurer rose walk: 361 vertices placed at theta = i * d degrees for
 * i = 0..360, each lying on the rose r = sin(n * theta). Joining these vertices
 * with straight lines produces the dense web of chords that defines the figure.
 */
export function maurerVertices(n: number, d: number, radius: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= 360; i++) {
    pts.push(rosePoint(i * d * DEG_TO_RAD, n, radius));
  }
  return pts;
}

/**
 * Dense samples of the smooth rose over a full turn, used as the faint backdrop
 * curve behind the Maurer chords. Returns exactly `steps` points.
 */
export function rosePetals(n: number, radius: number, steps: number): Point[] {
  if (steps <= 0) return [];
  const pts: Point[] = [];
  const divisor = steps > 1 ? steps - 1 : 1;
  for (let i = 0; i < steps; i++) {
    pts.push(rosePoint((i / divisor) * TAU, n, radius));
  }
  return pts;
}
