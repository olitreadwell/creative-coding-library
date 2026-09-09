import { describe, it, expect } from "vitest";
import { makeGrid, step, DEFAULT_PARAMS, PRESETS } from "./grayscott";

const W = 20;
const H = 15;
const SEED = "test-seed-42";

describe("makeGrid", () => {
  it("creates arrays of the correct length", () => {
    const grid = makeGrid(W, H, SEED);
    expect(grid.a.length).toBe(W * H);
    expect(grid.b.length).toBe(W * H);
    expect(grid.width).toBe(W);
    expect(grid.height).toBe(H);
  });

  it("initialises A to 1 in unseeded cells", () => {
    const grid = makeGrid(W, H, SEED);
    // At minimum one cell must be exactly 1 (unseeded regions).
    const hasOne = Array.from(grid.a).some((v) => v === 1.0);
    expect(hasOne).toBe(true);
  });

  it("seeds at least one B cell above zero", () => {
    const grid = makeGrid(W, H, SEED);
    const hasB = Array.from(grid.b).some((v) => v > 0);
    expect(hasB).toBe(true);
  });

  it("keeps all A values in [0, 1]", () => {
    const grid = makeGrid(W, H, SEED);
    for (let i = 0; i < grid.a.length; i++) {
      const v = grid.a[i] ?? 0;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("keeps all B values in [0, 1]", () => {
    const grid = makeGrid(W, H, SEED);
    for (let i = 0; i < grid.b.length; i++) {
      const v = grid.b[i] ?? 0;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for the same seed", () => {
    const g1 = makeGrid(W, H, SEED);
    const g2 = makeGrid(W, H, SEED);
    expect(Array.from(g1.a)).toEqual(Array.from(g2.a));
    expect(Array.from(g1.b)).toEqual(Array.from(g2.b));
  });

  it("produces different layouts for different seeds", () => {
    const g1 = makeGrid(W, H, "seed-one");
    const g2 = makeGrid(W, H, "seed-two");
    // The A arrays should differ in at least one cell.
    const differ = Array.from(g1.a).some((v, i) => v !== (g2.a[i] ?? 0));
    expect(differ).toBe(true);
  });
});

describe("step", () => {
  it("returns Float32Arrays of the same length as the input", () => {
    const { a, b, width, height } = makeGrid(W, H, SEED);
    const next = step(a, b, width, height, DEFAULT_PARAMS);
    expect(next.a.length).toBe(a.length);
    expect(next.b.length).toBe(b.length);
  });

  it("does not mutate the input arrays", () => {
    const { a, b, width, height } = makeGrid(W, H, SEED);
    const aCopy = a.slice();
    const bCopy = b.slice();
    step(a, b, width, height, DEFAULT_PARAMS);
    expect(Array.from(a)).toEqual(Array.from(aCopy));
    expect(Array.from(b)).toEqual(Array.from(bCopy));
  });

  it("keeps all values in [0, 1] after one step", () => {
    const { a, b, width, height } = makeGrid(W, H, SEED);
    const next = step(a, b, width, height, DEFAULT_PARAMS);
    for (let i = 0; i < next.a.length; i++) {
      const av = next.a[i] ?? 0;
      const bv = next.b[i] ?? 0;
      expect(av).toBeGreaterThanOrEqual(0);
      expect(av).toBeLessThanOrEqual(1);
      expect(bv).toBeGreaterThanOrEqual(0);
      expect(bv).toBeLessThanOrEqual(1);
    }
  });

  it("keeps all values finite after 20 steps", () => {
    let { a, b, width, height } = makeGrid(W, H, SEED);
    for (let s = 0; s < 20; s++) {
      const next = step(a, b, width, height, DEFAULT_PARAMS);
      a = next.a;
      b = next.b;
    }
    for (let i = 0; i < a.length; i++) {
      expect(Number.isFinite(a[i] ?? 0)).toBe(true);
      expect(Number.isFinite(b[i] ?? 0)).toBe(true);
    }
  });

  it("keeps values in [0, 1] after 20 steps", () => {
    let { a, b, width, height } = makeGrid(W, H, SEED);
    for (let s = 0; s < 20; s++) {
      const next = step(a, b, width, height, DEFAULT_PARAMS);
      a = next.a;
      b = next.b;
    }
    for (let i = 0; i < a.length; i++) {
      expect(a[i] ?? 0).toBeGreaterThanOrEqual(0);
      expect(a[i] ?? 0).toBeLessThanOrEqual(1);
      expect(b[i] ?? 0).toBeGreaterThanOrEqual(0);
      expect(b[i] ?? 0).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic: same grid and params produce identical output", () => {
    const { a, b, width, height } = makeGrid(W, H, SEED);
    const out1 = step(a, b, width, height, DEFAULT_PARAMS);
    const out2 = step(a, b, width, height, DEFAULT_PARAMS);
    expect(Array.from(out1.a)).toEqual(Array.from(out2.a));
    expect(Array.from(out1.b)).toEqual(Array.from(out2.b));
  });

  it("a uniform A=1, B=0 field stays at A=1, B=0 (stable equilibrium)", () => {
    // With no B present, the reaction term A*B*B = 0, and A is at equilibrium
    // (feed*(1-A) = 0 when A=1). So nothing should change.
    const size = W * H;
    const a = new Float32Array(size).fill(1.0);
    const b = new Float32Array(size).fill(0.0);
    const next = step(a, b, W, H, DEFAULT_PARAMS);
    for (let i = 0; i < size; i++) {
      expect(next.a[i] ?? 0).toBeCloseTo(1.0, 5);
      expect(next.b[i] ?? 0).toBeCloseTo(0.0, 5);
    }
  });

  it("produces different results for different presets", () => {
    const { a, b, width, height } = makeGrid(W, H, SEED);
    const out1 = step(a, b, width, height, PRESETS.spots);
    const out2 = step(a, b, width, height, PRESETS.stripes);
    const differ = Array.from(out1.b).some((v, i) => v !== (out2.b[i] ?? 0));
    expect(differ).toBe(true);
  });
});
