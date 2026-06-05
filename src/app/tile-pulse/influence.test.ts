import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { radialFalloff, easeInOutCubic, easeOutCubic, rippleInfluence } from "./influence";

describe("radialFalloff", () => {
  it("returns 1 at the origin", () => {
    expect(radialFalloff(0, 100)).toBe(1);
  });

  it("returns 0 at the radius boundary", () => {
    expect(radialFalloff(100, 100)).toBe(0);
  });

  it("returns 0 beyond the radius", () => {
    expect(radialFalloff(150, 100)).toBe(0);
  });

  it("returns 0 for zero or negative radius", () => {
    expect(radialFalloff(0, 0)).toBe(0);
    expect(radialFalloff(10, -5)).toBe(0);
  });

  it("is always in [0, 1] for any non-negative dist and positive radius", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true }),
        fc.double({ min: 0.001, max: 1000, noNaN: true }),
        (dist, radius) => {
          const v = radialFalloff(dist, radius);
          return v >= 0 && v <= 1;
        },
      ),
    );
  });

  it("is monotonically non-increasing with distance", () => {
    const radius = 200;
    let prev = radialFalloff(0, radius);
    for (let d = 10; d <= 200; d += 10) {
      const cur = radialFalloff(d, radius);
      expect(cur).toBeLessThanOrEqual(prev + 1e-10);
      prev = cur;
    }
  });
});

describe("easeInOutCubic", () => {
  it("returns 0 at t=0", () => {
    expect(easeInOutCubic(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("returns 0.5 at t=0.5 (symmetric)", () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
  });

  it("clamps values outside [0, 1]", () => {
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });

  it("output is always in [0, 1]", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), (t) => {
        const v = easeInOutCubic(t);
        return v >= 0 && v <= 1;
      }),
    );
  });
});

describe("easeOutCubic", () => {
  it("returns 0 at t=0", () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it("output is always in [0, 1]", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), (t) => {
        const v = easeOutCubic(t);
        return v >= 0 && v <= 1;
      }),
    );
  });
});

describe("rippleInfluence", () => {
  it("returns 0 when dist is beyond the ripple radius", () => {
    expect(rippleInfluence(250, 200, 40)).toBe(0);
  });

  it("returns 0 when dist is inside the inner edge", () => {
    expect(rippleInfluence(50, 200, 40)).toBe(0);
  });

  it("returns 0 for zero ring width", () => {
    expect(rippleInfluence(100, 200, 0)).toBe(0);
  });

  it("returns 1 at the centre of the ring", () => {
    const radius = 200;
    const width = 40;
    const midDist = radius - width / 2;
    expect(rippleInfluence(midDist, radius, width)).toBeCloseTo(1, 5);
  });

  it("output is always in [0, 1] for valid inputs", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500, noNaN: true }),
        fc.double({ min: 0, max: 500, noNaN: true }),
        fc.double({ min: 1, max: 100, noNaN: true }),
        (dist, rippleRadius, ringWidth) => {
          const v = rippleInfluence(dist, rippleRadius, ringWidth);
          return v >= 0 && v <= 1;
        },
      ),
    );
  });
});
