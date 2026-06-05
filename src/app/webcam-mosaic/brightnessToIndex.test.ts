import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { brightnessToIndex } from "./brightnessToIndex";

describe("brightnessToIndex", () => {
  it("maps brightness 0 (darkest) to index 0 (densest glyph)", () => {
    expect(brightnessToIndex(0, 10)).toBe(9);
  });

  it("maps brightness 1 (brightest) to index count-1 (sparsest glyph)", () => {
    expect(brightnessToIndex(1, 10)).toBe(0);
  });

  it("maps brightness 0.5 to middle index with even count", () => {
    const idx = brightnessToIndex(0.5, 10);
    expect(idx).toBeGreaterThanOrEqual(4);
    expect(idx).toBeLessThanOrEqual(5);
  });

  it("always returns 0 when count is 1", () => {
    expect(brightnessToIndex(0, 1)).toBe(0);
    expect(brightnessToIndex(0.5, 1)).toBe(0);
    expect(brightnessToIndex(1, 1)).toBe(0);
  });

  it("returns 0 when count is 0 or negative", () => {
    expect(brightnessToIndex(0.5, 0)).toBe(0);
    expect(brightnessToIndex(0.5, -5)).toBe(0);
  });

  it("clamps out-of-range brightness without throwing", () => {
    expect(brightnessToIndex(-0.5, 10)).toBe(9);
    expect(brightnessToIndex(1.5, 10)).toBe(0);
  });

  it("always returns an integer in [0, count-1] for any brightness and count", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.integer({ min: 1, max: 100 }),
        (brightness, count) => {
          const idx = brightnessToIndex(brightness, count);
          return Number.isInteger(idx) && idx >= 0 && idx <= count - 1;
        },
      ),
    );
  });

  it("is monotonically non-increasing as brightness increases (higher brightness = lower index)", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.float({ min: 0, max: 0.5, noNaN: true }),
          fc.float({ min: 0.5, max: 1, noNaN: true }),
        ),
        fc.integer({ min: 2, max: 100 }),
        ([lo, hi], count) => {
          return brightnessToIndex(lo, count) >= brightnessToIndex(hi, count);
        },
      ),
    );
  });
});
