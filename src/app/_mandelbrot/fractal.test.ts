import { describe, it, expect } from "vitest";
import { mandelEscape, pixelToComplex } from "./fractal";
import type { View } from "./fractal";

const MAX_ITER = 256;

const DEFAULT_VIEW: View = { centerX: -0.6, centerY: 0, span: 3.5 };

describe("mandelEscape", () => {
  it("returns maxIter for the origin (in the set)", () => {
    const result = mandelEscape(0, 0, MAX_ITER);
    expect(result).toBe(MAX_ITER);
  });

  it("returns maxIter for a known interior point (-0.5, 0)", () => {
    const result = mandelEscape(-0.5, 0, MAX_ITER);
    expect(result).toBe(MAX_ITER);
  });

  it("escapes quickly for a far exterior point (2, 2)", () => {
    const result = mandelEscape(2, 2, MAX_ITER);
    expect(result).toBeLessThan(5);
  });

  it("escapes for a point clearly outside the set (3, 0)", () => {
    const result = mandelEscape(3, 0, MAX_ITER);
    expect(result).toBeLessThan(MAX_ITER);
  });

  it("returns a finite number for boundary points", () => {
    const result = mandelEscape(-0.75, 0.1, MAX_ITER);
    expect(Number.isFinite(result)).toBe(true);
  });

  it("smooth count is fractional for escaping points", () => {
    const result = mandelEscape(2, 2, MAX_ITER);
    expect(result % 1).not.toBe(0);
  });

  it("uses DEFAULT_MAX_ITER when called without maxIter", () => {
    const withDefault = mandelEscape(0, 0);
    expect(withDefault).toBe(256);
  });
});

describe("pixelToComplex", () => {
  const W = 800;
  const H = 600;

  it("maps the center pixel to the view center", () => {
    const c = pixelToComplex(W / 2, H / 2, W, H, DEFAULT_VIEW);
    expect(c.x).toBeCloseTo(DEFAULT_VIEW.centerX, 10);
    expect(c.y).toBeCloseTo(DEFAULT_VIEW.centerY, 10);
  });

  it("maps the top-left pixel to the upper-left of the complex window", () => {
    const c = pixelToComplex(0, 0, W, H, DEFAULT_VIEW);
    const aspectRatio = W / H;
    const expectedX = DEFAULT_VIEW.centerX - (DEFAULT_VIEW.span / 2) * aspectRatio;
    const expectedY = DEFAULT_VIEW.centerY + DEFAULT_VIEW.span / 2;
    expect(c.x).toBeCloseTo(expectedX, 10);
    expect(c.y).toBeCloseTo(expectedY, 10);
  });

  it("maps the bottom-right pixel to the lower-right of the complex window", () => {
    const c = pixelToComplex(W, H, W, H, DEFAULT_VIEW);
    const aspectRatio = W / H;
    const expectedX = DEFAULT_VIEW.centerX + (DEFAULT_VIEW.span / 2) * aspectRatio;
    const expectedY = DEFAULT_VIEW.centerY - DEFAULT_VIEW.span / 2;
    expect(c.x).toBeCloseTo(expectedX, 10);
    expect(c.y).toBeCloseTo(expectedY, 10);
  });

  it("returns a finite real and imaginary part", () => {
    const c = pixelToComplex(400, 300, W, H, DEFAULT_VIEW);
    expect(Number.isFinite(c.x)).toBe(true);
    expect(Number.isFinite(c.y)).toBe(true);
  });
});
