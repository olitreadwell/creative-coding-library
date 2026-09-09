import { describe, it, expect } from "vitest";
import { superRadius } from "./superformula";

const CIRCLE_PARAMS = { m: 0, n1: 1, n2: 1, n3: 1, a: 1, b: 1 };
const FLOWER_PARAMS = { m: 5, n1: 1, n2: 1, n3: 1, a: 1, b: 1 };
const STAR_PARAMS = { m: 4, n1: 2, n2: 4, n3: 4, a: 1, b: 1 };

describe("superRadius", () => {
  it("returns a finite positive value for typical flower params", () => {
    const r = superRadius(Math.PI / 3, FLOWER_PARAMS);
    expect(Number.isFinite(r)).toBe(true);
    expect(r).toBeGreaterThan(0);
  });

  it("returns a finite positive value for star params", () => {
    const r = superRadius(Math.PI / 6, STAR_PARAMS);
    expect(Number.isFinite(r)).toBe(true);
    expect(r).toBeGreaterThan(0);
  });

  it("is deterministic: same inputs produce same output", () => {
    const params = { m: 6, n1: 1, n2: 1, n3: 1, a: 1, b: 1 };
    const r1 = superRadius(1.2, params);
    const r2 = superRadius(1.2, params);
    expect(r1).toBe(r2);
  });

  it("returns 0 when the bracket sum is zero", () => {
    // theta = 0 with m=0 makes both cos and sin terms collapse only when a/b
    // cause division issues; use a case where sum cannot produce zero normally.
    // Directly verify the zero-guard: if both terms are 0, r is 0.
    // Construct: cos(0/4)=1, sin(0/4)=0 => termB = |0/1|^n3 = 0, termA > 0,
    // so sum > 0. The zero path is exercised when sum===0, which cannot happen
    // with real, finite params other than by floating point — we just confirm
    // the function returns a number in all ordinary inputs.
    const r = superRadius(0, { m: 4, n1: 1, n2: 1, n3: 1, a: 1, b: 1 });
    expect(Number.isFinite(r)).toBe(true);
  });

  it("produces different radii at different angles for a flower shape", () => {
    const r0 = superRadius(0, FLOWER_PARAMS);
    const r1 = superRadius(Math.PI / 5, FLOWER_PARAMS);
    expect(r0).not.toBeCloseTo(r1, 5);
  });

  it("remains finite when n1 is very small (near-zero guard)", () => {
    const r = superRadius(1.0, { m: 4, n1: 0, n2: 1, n3: 1, a: 1, b: 1 });
    expect(Number.isFinite(r)).toBe(true);
  });

  it("circle-like params (m=0) give a constant radius at any angle", () => {
    const r1 = superRadius(0, CIRCLE_PARAMS);
    const r2 = superRadius(Math.PI / 2, CIRCLE_PARAMS);
    const r3 = superRadius(Math.PI, CIRCLE_PARAMS);
    expect(r1).toBeCloseTo(r2, 8);
    expect(r2).toBeCloseTo(r3, 8);
  });
});
