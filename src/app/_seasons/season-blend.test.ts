import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  lerpRgb,
  blendSeasonRibbons,
  blendBg,
  nextSeason,
  SEASONS,
  SEASON_PALETTES,
  type RgbTuple,
} from "./season-blend";

describe("lerpRgb", () => {
  it("returns `a` when t=0", () => {
    const a: RgbTuple = [100, 150, 200];
    const b: RgbTuple = [0, 50, 255];
    expect(lerpRgb(a, b, 0)).toEqual([100, 150, 200]);
  });

  it("returns `b` when t=1", () => {
    const a: RgbTuple = [100, 150, 200];
    const b: RgbTuple = [0, 50, 255];
    expect(lerpRgb(a, b, 1)).toEqual([0, 50, 255]);
  });

  it("midpoint is the average for equidistant channels", () => {
    const a: RgbTuple = [0, 0, 0];
    const b: RgbTuple = [100, 200, 50];
    const mid = lerpRgb(a, b, 0.5);
    expect(mid[0]).toBe(50);
    expect(mid[1]).toBe(100);
    expect(mid[2]).toBe(25);
  });

  it("all channels stay within 0-255 for any t in [0,1]", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
        ),
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
        ),
        fc.float({ min: 0, max: 1 }),
        (aArr, bArr, t) => {
          const a = aArr as RgbTuple;
          const b = bArr as RgbTuple;
          const result = lerpRgb(a, b, t);
          return result.every((v) => v >= 0 && v <= 255);
        },
      ),
    );
  });
});

describe("blendSeasonRibbons", () => {
  it("returns `from` colors at t=0", () => {
    const from = SEASON_PALETTES.spring;
    const to = SEASON_PALETTES.summer;
    const { ribbons } = blendSeasonRibbons(from, to, 0);
    ribbons.forEach((ribbon, i) => {
      const expected = from.ribbons[i] ?? from.ribbons[0] ?? [0, 0, 0];
      expect(ribbon).toEqual(expected);
    });
  });

  it("returns `to` colors at t=1", () => {
    const from = SEASON_PALETTES.spring;
    const to = SEASON_PALETTES.summer;
    const { ribbons } = blendSeasonRibbons(from, to, 1);
    ribbons.forEach((ribbon, i) => {
      const expected = to.ribbons[i] ?? to.ribbons[0] ?? [0, 0, 0];
      expect(ribbon).toEqual(expected);
    });
  });

  it("produces a ribbon array of length equal to from.ribbons", () => {
    const from = SEASON_PALETTES.autumn;
    const to = SEASON_PALETTES.winter;
    const { ribbons } = blendSeasonRibbons(from, to, 0.5);
    expect(ribbons).toHaveLength(from.ribbons.length);
  });
});

describe("blendBg", () => {
  it("returns the `a` color when t=0", () => {
    expect(blendBg("#000000", "#ffffff", 0)).toBe("#000000");
  });

  it("returns the `b` color when t=1", () => {
    expect(blendBg("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("returns a mid-gray at t=0.5 between black and white", () => {
    const mid = blendBg("#000000", "#ffffff", 0.5);
    expect(mid).toBe("#808080");
  });
});

describe("nextSeason", () => {
  it("cycles through all four seasons in order", () => {
    expect(nextSeason("spring")).toBe("summer");
    expect(nextSeason("summer")).toBe("autumn");
    expect(nextSeason("autumn")).toBe("winter");
    expect(nextSeason("winter")).toBe("spring");
  });

  it("every season maps to a defined next season", () => {
    for (const s of SEASONS) {
      const n = nextSeason(s);
      expect(SEASONS).toContain(n);
    }
  });
});
