import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { trailIndex, senseDirection } from "./physarum";

describe("trailIndex", () => {
  it("returns 0 for (0, 0)", () => {
    expect(trailIndex(0, 0, 10, 10)).toBe(0);
  });

  it("wraps x at the right edge", () => {
    expect(trailIndex(10, 0, 10, 10)).toBe(0);
  });

  it("wraps y at the bottom edge", () => {
    expect(trailIndex(0, 10, 10, 10)).toBe(0);
  });

  it("wraps negative x", () => {
    expect(trailIndex(-1, 0, 10, 10)).toBe(9);
  });

  it("wraps negative y", () => {
    expect(trailIndex(0, -1, 10, 10)).toBe(90);
  });

  it("is always in bounds (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -200, max: 200 }),
        fc.integer({ min: -200, max: 200 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (x, y, w, h) => {
          const idx = trailIndex(x, y, w, h);
          return idx >= 0 && idx < w * h;
        },
      ),
    );
  });
});

describe("senseDirection", () => {
  it("reads zero from an empty trail", () => {
    const trail = new Float32Array(100);
    expect(senseDirection(trail, 5, 5, 0, 2, 10, 10)).toBe(0);
  });

  it("reads a deposited value in the direction sensed", () => {
    const w = 20;
    const h = 20;
    const trail = new Float32Array(w * h);
    // Deposit trail two cells to the right of (5, 5).
    trail[5 * w + 7] = 0.8;
    const val = senseDirection(trail, 5, 5, 0, 2, w, h);
    expect(val).toBeCloseTo(0.8);
  });

  it("wraps around the grid edges (property)", () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 1, noNaN: true }), (deposit) => {
        const w = 10;
        const h = 10;
        const trail = new Float32Array(w * h).fill(deposit);
        const val = senseDirection(trail, 0, 0, Math.PI * 1.5, 3, w, h);
        return Math.abs(val - deposit) < 1e-5;
      }),
    );
  });
});
