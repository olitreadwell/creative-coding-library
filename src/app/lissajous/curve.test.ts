import { describe, it, expect } from "vitest";
import { lissajousPoint, samplePath } from "./curve";
import { TAU } from "@/lib/creative/math";

const BASE_PARAMS = { a: 3, b: 2, A: 1, B: 1, phase: 0 };

describe("lissajousPoint", () => {
  it("at s=0 with phase=0 returns {x: 0, y: 0}", () => {
    // sin(a*0 + 0) = 0, sin(b*0) = 0
    const pt = lissajousPoint(0, BASE_PARAMS);
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(0);
  });

  it("at s=0 with non-zero phase, x equals A*sin(phase)", () => {
    const phase = Math.PI / 4;
    const A = 2;
    const pt = lissajousPoint(0, { ...BASE_PARAMS, A, phase });
    expect(pt.x).toBeCloseTo(A * Math.sin(phase));
    expect(pt.y).toBeCloseTo(0);
  });

  it("applies decay correctly at s=0 (envelope = 1)", () => {
    const pt = lissajousPoint(0, { ...BASE_PARAMS, decay: 0.5 });
    // exp(-0.5 * 0) = 1, so same as no decay at s=0
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(0);
  });

  it("decay shrinks the amplitude as s increases", () => {
    // phase=PI/2 so x at s~0 is near A (maximum).
    // At s=10, envelope = exp(-0.3*10) = exp(-3) ≈ 0.05 — much smaller.
    const params = { a: 1, b: 1, A: 1, B: 1, phase: Math.PI / 2, decay: 0.3 };
    const ptEarly = lissajousPoint(0.01, params);
    const ptLate = lissajousPoint(10, params);
    // Early envelope ≈ 1, late envelope ≈ 0.05, so late magnitude < half early.
    expect(Math.abs(ptLate.x)).toBeLessThan(Math.abs(ptEarly.x) * 0.5);
  });

  it("stays within [-A, A] x [-B, B] when decay = 0", () => {
    const A = 3;
    const B = 2;
    const params = { a: 5, b: 4, A, B, phase: 0.7 };
    for (let i = 0; i < 100; i++) {
      const s = (i / 99) * TAU * 4;
      const pt = lissajousPoint(s, params);
      expect(pt.x).toBeGreaterThanOrEqual(-A - 1e-9);
      expect(pt.x).toBeLessThanOrEqual(A + 1e-9);
      expect(pt.y).toBeGreaterThanOrEqual(-B - 1e-9);
      expect(pt.y).toBeLessThanOrEqual(B + 1e-9);
    }
  });

  it("is deterministic: same inputs produce same output", () => {
    const pt1 = lissajousPoint(1.23, BASE_PARAMS);
    const pt2 = lissajousPoint(1.23, BASE_PARAMS);
    expect(pt1.x).toBe(pt2.x);
    expect(pt1.y).toBe(pt2.y);
  });
});

describe("samplePath", () => {
  it("returns exactly `steps` points", () => {
    const pts = samplePath(BASE_PARAMS, 500);
    expect(pts).toHaveLength(500);
  });

  it("returns exactly `steps` points for various step counts", () => {
    expect(samplePath(BASE_PARAMS, 1)).toHaveLength(1);
    expect(samplePath(BASE_PARAMS, 100)).toHaveLength(100);
    expect(samplePath(BASE_PARAMS, 1000)).toHaveLength(1000);
  });

  it("all points stay within [-A, A] x [-B, B] when decay = 0", () => {
    const A = 2;
    const B = 3;
    const pts = samplePath({ a: 3, b: 2, A, B, phase: 0 }, 500);
    for (const pt of pts) {
      expect(pt.x).toBeGreaterThanOrEqual(-A - 1e-9);
      expect(pt.x).toBeLessThanOrEqual(A + 1e-9);
      expect(pt.y).toBeGreaterThanOrEqual(-B - 1e-9);
      expect(pt.y).toBeLessThanOrEqual(B + 1e-9);
    }
  });

  it("is deterministic: two calls with the same params return identical points", () => {
    const pts1 = samplePath(BASE_PARAMS, 200);
    const pts2 = samplePath(BASE_PARAMS, 200);
    for (let i = 0; i < pts1.length; i++) {
      expect(pts1[i]?.x).toBe(pts2[i]?.x);
      expect(pts1[i]?.y).toBe(pts2[i]?.y);
    }
  });
});
