import { describe, it, expect } from "vitest";
import { hsl, hslString, hslToRgb, rgbToHex, shift } from "./color";

describe("hsl", () => {
  it("wraps hue into [0, 360) and clamps s/l into [0, 1]", () => {
    expect(hsl(370, 1.5, -0.2)).toEqual({ h: 10, s: 1, l: 0 });
  });
});

describe("hslString", () => {
  it("formats with hsl(... / alpha) notation", () => {
    expect(hslString({ h: 200, s: 0.5, l: 0.4 }, 0.8)).toBe("hsl(200.00 50.00% 40.00% / 0.8)");
  });
  it("defaults alpha to 1", () => {
    expect(hslString({ h: 0, s: 1, l: 0.5 })).toMatch(/ \/ 1\)$/);
  });
});

describe("hslToRgb", () => {
  it("converts pure red (0, 1, 0.5) to (1, 0, 0)", () => {
    const { r, g, b } = hslToRgb({ h: 0, s: 1, l: 0.5 });
    expect(r).toBeCloseTo(1, 5);
    expect(g).toBeCloseTo(0, 5);
    expect(b).toBeCloseTo(0, 5);
  });
  it("converts grey (l=0.5, s=0) to (0.5, 0.5, 0.5)", () => {
    const { r, g, b } = hslToRgb({ h: 120, s: 0, l: 0.5 });
    expect(r).toBeCloseTo(0.5, 5);
    expect(g).toBeCloseTo(0.5, 5);
    expect(b).toBeCloseTo(0.5, 5);
  });
});

describe("rgbToHex", () => {
  it("emits a 7-char lowercased hex string", () => {
    expect(rgbToHex({ r: 1, g: 0, b: 0 })).toBe("#ff0000");
    expect(rgbToHex({ r: 0, g: 0.5, b: 1 })).toBe("#0080ff");
  });
});

describe("shift", () => {
  it("offsets h/s/l components", () => {
    const base = hsl(100, 0.5, 0.5);
    expect(shift(base, 10, 0.1, -0.1)).toEqual({ h: 110, s: 0.6, l: 0.4 });
  });
});
