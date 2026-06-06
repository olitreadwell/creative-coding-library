import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { maurerVertices, rosePetals, rosePoint } from "./rose";

const hypot = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);

describe("rosePoint", () => {
  it("sits at the origin when sin(n*theta) is zero", () => {
    expect(rosePoint(0, 5, 100)).toEqual({ x: 0, y: 0 });
    expect(hypot(rosePoint(Math.PI, 4, 100))).toBeCloseTo(0, 9);
  });

  it("never exceeds the radius, since |sin| <= 1", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.integer({ min: 1, max: 12 }),
        (theta, n) => {
          const r = 50;
          expect(hypot(rosePoint(theta, n, r))).toBeLessThanOrEqual(r + 1e-9);
        },
      ),
    );
  });
});

describe("maurerVertices", () => {
  it("returns 361 vertices (i = 0..360 inclusive)", () => {
    expect(maurerVertices(6, 71, 100)).toHaveLength(361);
  });

  it("starts and ends at the origin", () => {
    const pts = maurerVertices(6, 71, 100);
    expect(hypot(pts[0]!)).toBeCloseTo(0, 9);
    expect(hypot(pts[360]!)).toBeCloseTo(0, 9);
  });

  it("keeps every vertex within the radius", () => {
    const r = 120;
    for (const p of maurerVertices(7, 113, r)) {
      expect(hypot(p)).toBeLessThanOrEqual(r + 1e-9);
    }
  });
});

describe("rosePetals", () => {
  it("returns exactly `steps` points and is empty for steps <= 0", () => {
    expect(rosePetals(4, 100, 256)).toHaveLength(256);
    expect(rosePetals(4, 100, 0)).toHaveLength(0);
  });
});
