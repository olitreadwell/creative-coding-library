import { describe, it, expect } from "vitest";
import { makeRng } from "@/lib/creative/random";
import { makeSpecs } from "./bodies";

const WIDTH = 800;

describe("makeSpecs", () => {
  it("returns exactly count specs", () => {
    const rng = makeRng("count-test");
    expect(makeSpecs(rng, 40, WIDTH)).toHaveLength(40);
    expect(makeSpecs(makeRng("zero"), 0, WIDTH)).toHaveLength(0);
    expect(makeSpecs(makeRng("one"), 1, WIDTH)).toHaveLength(1);
  });

  it("every spec.x is within [0, width]", () => {
    const specs = makeSpecs(makeRng("x-bounds"), 80, WIDTH);
    for (const s of specs) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(WIDTH);
    }
  });

  it("every size is within expected bounds [40, 80]", () => {
    const specs = makeSpecs(makeRng("sizes"), 80, WIDTH);
    for (const s of specs) {
      expect(s.size).toBeGreaterThanOrEqual(40);
      expect(s.size).toBeLessThanOrEqual(80);
    }
  });

  it('kind is always "circle" or "poly"', () => {
    const specs = makeSpecs(makeRng("kinds"), 80, WIDTH);
    for (const s of specs) {
      expect(s.kind === "circle" || s.kind === "poly").toBe(true);
    }
  });

  it("hue is within [0, 360)", () => {
    const specs = makeSpecs(makeRng("hue"), 80, WIDTH);
    for (const s of specs) {
      expect(s.hue).toBeGreaterThanOrEqual(0);
      expect(s.hue).toBeLessThan(360);
    }
  });

  it("is deterministic: same seed produces the same specs", () => {
    const a = makeSpecs(makeRng("determinism"), 40, WIDTH);
    const b = makeSpecs(makeRng("determinism"), 40, WIDTH);
    expect(a).toEqual(b);
  });

  it("different seeds produce different specs", () => {
    const a = makeSpecs(makeRng("seed-alpha"), 40, WIDTH);
    const b = makeSpecs(makeRng("seed-beta"), 40, WIDTH);
    const xA = a.map((s) => s.x).join(",");
    const xB = b.map((s) => s.x).join(",");
    expect(xA).not.toBe(xB);
  });

  it("poly specs have sides in [3, 7]", () => {
    const specs = makeSpecs(makeRng("sides"), 200, WIDTH);
    for (const s of specs) {
      if (s.kind === "poly") {
        expect(s.sides).toBeGreaterThanOrEqual(3);
        expect(s.sides).toBeLessThanOrEqual(7);
      }
    }
  });

  it("circle specs have sides === 0", () => {
    const specs = makeSpecs(makeRng("circle-sides"), 200, WIDTH);
    for (const s of specs) {
      if (s.kind === "circle") {
        expect(s.sides).toBe(0);
      }
    }
  });
});
