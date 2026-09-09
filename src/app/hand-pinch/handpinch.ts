export type Point2 = { x: number; y: number };

/** Euclidean distance between two points. */
export function dist2(a: Point2, b: Point2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Distance between the thumb tip and index tip (in normalized 0..1 coords). */
export function pinchDistance(thumbTip: Point2, indexTip: Point2): number {
  return dist2(thumbTip, indexTip);
}

/** Whether the thumb and index are close enough to count as a pinch. */
export function isPinching(distance: number, threshold = 0.07): boolean {
  return distance < threshold;
}

/** Midpoint between two points (the "grab point" of a pinch). */
export function midpoint(a: Point2, b: Point2): Point2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
