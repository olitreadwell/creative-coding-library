import { describe, it, expect } from "vitest";
import { makeValueNoise2D, makePerlinNoise2D } from "./noise";

describe("makeValueNoise2D", () => {
  it("is deterministic for the same seed", () => {
    const a = makeValueNoise2D(7);
    const b = makeValueNoise2D(7);
    expect(a(0.1, 0.2)).toBe(b(0.1, 0.2));
    expect(a(12.5, 8.25)).toBe(b(12.5, 8.25));
  });
  it("returns values in [0, 1]", () => {
    const n = makeValueNoise2D(1);
    for (let i = 0; i < 100; i++) {
      const v = n(i * 0.13, i * 0.27);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
  it("is continuous (small input change => small output change)", () => {
    const n = makeValueNoise2D(2);
    const v0 = n(3, 4);
    const v1 = n(3 + 1e-3, 4);
    expect(Math.abs(v1 - v0)).toBeLessThan(0.05);
  });
});

describe("makePerlinNoise2D", () => {
  it("is deterministic for the same seed", () => {
    const a = makePerlinNoise2D(42);
    const b = makePerlinNoise2D(42);
    expect(a(0.3, 0.7)).toBe(b(0.3, 0.7));
  });
  it("returns values roughly within [-1, 1]", () => {
    const n = makePerlinNoise2D(3);
    for (let i = 0; i < 200; i++) {
      const v = n(i * 0.07, i * 0.11);
      expect(v).toBeGreaterThanOrEqual(-1.01);
      expect(v).toBeLessThanOrEqual(1.01);
    }
  });
});
