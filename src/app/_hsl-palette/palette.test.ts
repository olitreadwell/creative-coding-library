import { describe, it, expect } from "vitest";
import { hsl } from "@/lib/creative/color";
import type { Hsl } from "@/lib/creative/color";
import { generatePalette, readableText } from "./palette";

const BASE: Hsl = hsl(30, 0.8, 0.5);

describe("generatePalette", () => {
  it("complementary returns 2 colors", () => {
    expect(generatePalette(BASE, "complementary")).toHaveLength(2);
  });

  it("analogous returns 3 colors", () => {
    expect(generatePalette(BASE, "analogous")).toHaveLength(3);
  });

  it("triadic returns 3 colors", () => {
    expect(generatePalette(BASE, "triadic")).toHaveLength(3);
  });

  it("tetradic returns 4 colors", () => {
    expect(generatePalette(BASE, "tetradic")).toHaveLength(4);
  });

  it("monochromatic returns 5 colors", () => {
    expect(generatePalette(BASE, "monochromatic")).toHaveLength(5);
  });

  it("triadic hues are base, base+120, base+240 mod 360", () => {
    const palette = generatePalette(BASE, "triadic");
    const [a, b, c] = palette;
    expect(a?.h).toBeCloseTo(BASE.h % 360, 5);
    expect(b?.h).toBeCloseTo((BASE.h + 120) % 360, 5);
    expect(c?.h).toBeCloseTo((BASE.h + 240) % 360, 5);
  });

  it("complementary second hue is base+180 mod 360", () => {
    const palette = generatePalette(BASE, "complementary");
    const second = palette[1];
    expect(second?.h).toBeCloseTo((BASE.h + 180) % 360, 5);
  });

  it("monochromatic keeps hue constant across all swatches", () => {
    const palette = generatePalette(BASE, "monochromatic");
    for (const swatch of palette) {
      expect(swatch.h).toBeCloseTo(BASE.h, 5);
    }
  });

  it("monochromatic uses distinct lightness values", () => {
    const palette = generatePalette(BASE, "monochromatic");
    const lightnesses = palette.map((c) => c.l);
    const unique = new Set(lightnesses);
    expect(unique.size).toBe(palette.length);
  });
});

describe("readableText", () => {
  it("returns black (#000000) for a light color", () => {
    const light = hsl(200, 0.5, 0.8);
    expect(readableText(light)).toBe("#000000");
  });

  it("returns white (#ffffff) for a dark color", () => {
    const dark = hsl(200, 0.5, 0.2);
    expect(readableText(dark)).toBe("#ffffff");
  });

  it("returns black at exactly the threshold", () => {
    const threshold = hsl(0, 0, 0.55);
    expect(readableText(threshold)).toBe("#000000");
  });

  it("returns white just below the threshold", () => {
    const nearThreshold = hsl(0, 0, 0.54);
    expect(readableText(nearThreshold)).toBe("#ffffff");
  });
});
