export type Point = {
  x: number;
  y: number;
  px: number;
  py: number;
};

export type Blob = {
  points: Point[];
  restLengths: number[];
  restArea: number;
  color: string;
};

export function makePoint(x: number, y: number): Point {
  return { x, y, px: x, py: y };
}

/**
 * Advance a single point by one Verlet step.
 *
 * Verlet integration stores previous position instead of velocity. The velocity
 * is implicit: `pos - prev`. That makes it trivially stable under constraint
 * iteration because constraints move positions directly.
 */
export function verletStep(p: Point, dt: number, gravityPx: number, damping: number): Point {
  const vx = (p.x - p.px) * damping;
  const vy = (p.y - p.py) * damping;
  return {
    x: p.x + vx,
    y: p.y + vy + gravityPx * dt * dt,
    px: p.x,
    py: p.y,
  };
}

/**
 * Compute the signed area of a polygon using the shoelace formula.
 * Returns a positive value for counter-clockwise winding.
 */
export function polygonArea(points: readonly Point[]): number {
  const n = points.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    if (!a || !b) continue;
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) * 0.5;
}

/**
 * Solve one distance constraint between points a and b toward `restLen`.
 * `stiffness` is in [0, 1]: 1 = fully rigid each iteration, lower = softer.
 * Modifies a and b in place.
 */
export function solveDistanceConstraint(
  a: Point,
  b: Point,
  restLen: number,
  stiffness: number,
): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1e-6) return;
  const correction = ((dist - restLen) / dist) * 0.5 * stiffness;
  a.x += dx * correction;
  a.y += dy * correction;
  b.x -= dx * correction;
  b.y -= dy * correction;
}

/**
 * Apply a pressure force that pushes points outward to restore the blob's
 * rest area. Each edge contributes a normal force proportional to the area
 * deficit times the edge length. This is the classic "gas pressure" trick for
 * 2D soft bodies.
 */
export function applyPressure(blob: Blob, pressureStrength: number): void {
  const pts = blob.points;
  const n = pts.length;
  if (n === 0) return;
  const area = polygonArea(pts);
  const deficit = blob.restArea - area;
  if (Math.abs(deficit) < 1) return;

  // Centroid lets us orient each edge normal outward regardless of winding, so a
  // positive deficit (blob too small) always pushes the skin out and expands it.
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;

  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    if (!a || !b) continue;
    const edgeLen = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    let nx = -(b.y - a.y) / (edgeLen || 1);
    let ny = (b.x - a.x) / (edgeLen || 1);
    // Flip the normal if it points toward the centroid (i.e. inward).
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    if ((midX - cx) * nx + (midY - cy) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const force = deficit * pressureStrength * edgeLen;
    a.x += nx * force;
    a.y += ny * force;
    b.x += nx * force;
    b.y += ny * force;
  }
}

/**
 * Collide all points with the floor and walls. The "floor" y and "wall" x
 * edges are passed in so the caller can recompute them on resize.
 * Reflection is done by swapping position and previous position at the
 * boundary, which kills the velocity component into the wall.
 */
export function collideWithBounds(
  pts: Point[],
  minX: number,
  maxX: number,
  maxY: number,
  restitution: number,
): void {
  for (const p of pts) {
    if (p.y > maxY) {
      const vy = p.y - p.py;
      p.py = maxY + vy * restitution;
      p.y = maxY;
    }
    if (p.x < minX) {
      const vx = p.x - p.px;
      p.px = minX - vx * restitution;
      p.x = minX;
    }
    if (p.x > maxX) {
      const vx = p.x - p.px;
      p.px = maxX - vx * restitution;
      p.x = maxX;
    }
  }
}
