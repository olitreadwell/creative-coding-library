import { describe, it, expect } from "vitest";
import { OKABE_ITO, CB_ON_DARK, CB_ON_LIGHT, cbColors, cbColor } from "./cbpalette";

const HEX = /^#[0-9a-fA-F]{6}$/;

describe("cbpalette", () => {
  it("Okabe-Ito has 8 valid hex colors", () => {
    expect(OKABE_ITO).toHaveLength(8);
    for (const c of OKABE_ITO) expect(c).toMatch(HEX);
  });

  it("theme subsets are non-empty valid hex", () => {
    for (const c of [...CB_ON_DARK, ...CB_ON_LIGHT]) expect(c).toMatch(HEX);
    expect(CB_ON_DARK.length).toBeGreaterThan(3);
    expect(CB_ON_LIGHT.length).toBeGreaterThan(3);
  });

  it("cbColors picks the dark-bg set unless theme is light", () => {
    expect(cbColors("dark")).toBe(CB_ON_DARK);
    expect(cbColors(undefined)).toBe(CB_ON_DARK);
    expect(cbColors("light")).toBe(CB_ON_LIGHT);
  });

  it("cbColor cycles and handles negative indices", () => {
    const len = CB_ON_DARK.length;
    expect(cbColor(0, "dark")).toBe(CB_ON_DARK[0]);
    expect(cbColor(len, "dark")).toBe(CB_ON_DARK[0]);
    expect(cbColor(-1, "dark")).toBe(CB_ON_DARK[len - 1]);
  });
});
