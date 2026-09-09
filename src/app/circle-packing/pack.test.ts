import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { makeRng } from "@/lib/creative/random";
import { maxRadiusAt, packCircles, type Circle } from "./pack";

const opts = {
  width: 400,
  height: 300,
  attempts: 600,
  minRadius: 4,
  maxRadius: 60,
  padding: 1,
};

describe("maxRadiusAt", () => {
  it("is bounded by the nearest wall on an empty canvas", () => {
    // Point near the left wall: radius cannot exceed its x distance.
    expect(maxRadiusAt(10, 150, 400, 300, [], 1000)).toBeCloseTo(10, 9);
  });

  it("shrinks to meet an existing circle's edge", () => {
    const existing: Circle[] = [{ x: 200, y: 150, r: 30 }];
    // 100 px between centers, minus the radius 30, gives a 70 px gap.
    expect(maxRadiusAt(100, 150, 400, 300, existing, 1000)).toBeCloseTo(70, 9);
  });
});

describe("packCircles", () => {
  it("is deterministic for a given seed", () => {
    const a = packCircles(makeRng("rose"), opts);
    const b = packCircles(makeRng("rose"), opts);
    expect(a).toEqual(b);
  });

  it("never lets two circles overlap", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 50 }), (seed) => {
        const circles = packCircles(makeRng(seed), opts);
        for (let i = 0; i < circles.length; i++) {
          for (let j = i + 1; j < circles.length; j++) {
            const a = circles[i]!;
            const b = circles[j]!;
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            expect(dist).toBeGreaterThanOrEqual(a.r + b.r - 1e-6);
          }
        }
      }),
      { numRuns: 12 },
    );
  });

  it("keeps every circle inside the canvas", () => {
    for (const c of packCircles(makeRng(7), opts)) {
      expect(c.x - c.r).toBeGreaterThanOrEqual(-1e-6);
      expect(c.y - c.r).toBeGreaterThanOrEqual(-1e-6);
      expect(c.x + c.r).toBeLessThanOrEqual(opts.width + 1e-6);
      expect(c.y + c.r).toBeLessThanOrEqual(opts.height + 1e-6);
    }
  });

  it("respects the minimum radius", () => {
    for (const c of packCircles(makeRng(3), opts)) {
      expect(c.r).toBeGreaterThanOrEqual(opts.minRadius);
    }
  });
});
