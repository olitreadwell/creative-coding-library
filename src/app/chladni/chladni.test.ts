import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { chladni, nodeIntensity } from "./chladni";

describe("chladni", () => {
  it("is zero along the plate edges for integer modes", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 1, max: 9 }),
        (t, a, b) => {
          expect(chladni(0, t, a, b)).toBeCloseTo(0, 9);
          expect(chladni(t, 0, a, b)).toBeCloseTo(0, 9);
          expect(chladni(1, t, a, b)).toBeCloseTo(0, 9);
          expect(chladni(t, 1, a, b)).toBeCloseTo(0, 9);
        },
      ),
    );
  });

  it("is symmetric under swapping x and y", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 1, max: 9 }),
        (x, y, a, b) => {
          expect(chladni(x, y, a, b)).toBeCloseTo(chladni(y, x, a, b), 9);
        },
      ),
    );
  });

  it("stays within [-2, 2]", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 12 }),
        (x, y, a, b) => {
          const v = chladni(x, y, a, b);
          expect(v).toBeGreaterThanOrEqual(-2 - 1e-9);
          expect(v).toBeLessThanOrEqual(2 + 1e-9);
        },
      ),
    );
  });
});

describe("nodeIntensity", () => {
  it("peaks at a node and clamps to [0, 1]", () => {
    expect(nodeIntensity(0, 0.1)).toBe(1);
    expect(nodeIntensity(0.05, 0.1)).toBeCloseTo(0.5, 9);
    expect(nodeIntensity(0.1, 0.1)).toBeCloseTo(0, 9);
    expect(nodeIntensity(5, 0.1)).toBe(0);
    expect(nodeIntensity(-5, 0.1)).toBe(0);
  });
});
