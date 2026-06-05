import { describe, it, expect } from "vitest";
import { seedPosition, GOLDEN_ANGLE_DEG } from "./phyllotaxis";

const golden = (GOLDEN_ANGLE_DEG * Math.PI) / 180;

describe("phyllotaxis", () => {
  it("places the first seed at the center", () => {
    expect(seedPosition(0, golden, 8)).toEqual({ x: 0, y: 0 });
  });

  it("radius grows with the square root of the index", () => {
    const r4 = Math.hypot(...Object.values(seedPosition(4, golden, 8)));
    const r16 = Math.hypot(...Object.values(seedPosition(16, golden, 8)));
    // index 16 is 4x index 4, so radius should be ~2x (sqrt(16)/sqrt(4)).
    expect(r16 / r4).toBeCloseTo(2, 5);
  });

  it("is deterministic", () => {
    expect(seedPosition(50, golden, 8)).toEqual(seedPosition(50, golden, 8));
  });

  it("the golden angle is close to 137.5 degrees", () => {
    expect(GOLDEN_ANGLE_DEG).toBeGreaterThan(137.5);
    expect(GOLDEN_ANGLE_DEG).toBeLessThan(137.51);
  });
});
