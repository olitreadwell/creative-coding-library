import { describe, it, expect } from "vitest";
import { dist2, pinchDistance, isPinching, midpoint } from "./handpinch";

describe("hand-pinch helpers", () => {
  it("dist2 measures euclidean distance", () => {
    expect(dist2({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("pinchDistance is the thumb-index distance", () => {
    expect(pinchDistance({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.6 })).toBeCloseTo(0.1, 6);
  });

  it("isPinching is true only below the threshold", () => {
    expect(isPinching(0.04)).toBe(true);
    expect(isPinching(0.2)).toBe(false);
    expect(isPinching(0.05, 0.1)).toBe(true);
  });

  it("midpoint is the average of two points", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 1, y: 1 })).toEqual({ x: 0.5, y: 0.5 });
  });
});
