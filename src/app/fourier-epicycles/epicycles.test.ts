import { describe, it, expect } from "vitest";
import { epicyclePoint, epicycleArms, SQUARE_WAVE_TERMS, totalAmplitude } from "./epicycles";
import type { Term } from "./epicycles";

// ---------------------------------------------------------------------------
// epicyclePoint
// ---------------------------------------------------------------------------

describe("epicyclePoint", () => {
  it("returns {0,0} for an empty term list", () => {
    const result = epicyclePoint([], 0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("is deterministic: same t always gives the same result", () => {
    const r1 = epicyclePoint(SQUARE_WAVE_TERMS, 0.37);
    const r2 = epicyclePoint(SQUARE_WAVE_TERMS, 0.37);
    expect(r1.x).toBe(r2.x);
    expect(r1.y).toBe(r2.y);
  });

  it("at t=0 equals sum of amp*cos(phase) for x and amp*sin(phase) for y", () => {
    const terms: Term[] = [
      { freq: 1, amp: 2, phase: 0 },
      { freq: 3, amp: 1, phase: Math.PI / 4 },
    ];
    const expected = {
      x: 2 * Math.cos(0) + 1 * Math.cos(Math.PI / 4),
      y: 2 * Math.sin(0) + 1 * Math.sin(Math.PI / 4),
    };
    const result = epicyclePoint(terms, 0);
    expect(result.x).toBeCloseTo(expected.x, 10);
    expect(result.y).toBeCloseTo(expected.y, 10);
  });

  it("is bounded by the sum of all amplitudes", () => {
    const maxRadius = totalAmplitude(SQUARE_WAVE_TERMS);
    const samples = 50;
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const { x, y } = epicyclePoint(SQUARE_WAVE_TERMS, t);
      const radius = Math.sqrt(x * x + y * y);
      expect(radius).toBeLessThanOrEqual(maxRadius + 1e-9);
    }
  });

  it("returns finite numbers at t=0 and t=1", () => {
    for (const t of [0, 1]) {
      const { x, y } = epicyclePoint(SQUARE_WAVE_TERMS, t);
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });

  it("produces different positions for different t values", () => {
    const a = epicyclePoint(SQUARE_WAVE_TERMS, 0);
    const b = epicyclePoint(SQUARE_WAVE_TERMS, 0.5);
    // The square-wave trace is not symmetric around t=0 vs t=0.5.
    const differ = a.x !== b.x || a.y !== b.y;
    expect(differ).toBe(true);
  });

  it("handles a single term: x = amp*cos(freq*TAU*t + phase)", () => {
    const term: Term = { freq: 2, amp: 3, phase: 0.7 };
    const t = 0.25;
    const TAU = Math.PI * 2;
    const expected = {
      x: 3 * Math.cos(2 * TAU * t + 0.7),
      y: 3 * Math.sin(2 * TAU * t + 0.7),
    };
    const result = epicyclePoint([term], t);
    expect(result.x).toBeCloseTo(expected.x, 10);
    expect(result.y).toBeCloseTo(expected.y, 10);
  });
});

// ---------------------------------------------------------------------------
// epicycleArms
// ---------------------------------------------------------------------------

describe("epicycleArms", () => {
  it("returns an array with length equal to terms.length", () => {
    const arms = epicycleArms(SQUARE_WAVE_TERMS, 0);
    expect(arms.length).toBe(SQUARE_WAVE_TERMS.length);
  });

  it("final arm matches epicyclePoint", () => {
    const t = 0.13;
    const arms = epicycleArms(SQUARE_WAVE_TERMS, t);
    const point = epicyclePoint(SQUARE_WAVE_TERMS, t);
    const last = arms[arms.length - 1];
    expect(last?.x).toBeCloseTo(point.x, 10);
    expect(last?.y).toBeCloseTo(point.y, 10);
  });

  it("returns an empty array for empty terms", () => {
    expect(epicycleArms([], 0)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SQUARE_WAVE_TERMS preset
// ---------------------------------------------------------------------------

describe("SQUARE_WAVE_TERMS", () => {
  it("is non-empty", () => {
    expect(SQUARE_WAVE_TERMS.length).toBeGreaterThan(0);
  });

  it("all terms have positive amplitude", () => {
    for (const term of SQUARE_WAVE_TERMS) {
      expect(term.amp).toBeGreaterThan(0);
    }
  });

  it("all terms use odd harmonics (freq 1, 3, 5, ...)", () => {
    for (const term of SQUARE_WAVE_TERMS) {
      expect(term.freq % 2).toBe(1);
    }
  });

  it("amplitudes decrease as frequency increases", () => {
    for (let i = 1; i < SQUARE_WAVE_TERMS.length; i++) {
      const prev = SQUARE_WAVE_TERMS[i - 1];
      const curr = SQUARE_WAVE_TERMS[i];
      expect(prev?.amp).toBeGreaterThan(curr?.amp ?? Infinity);
    }
  });
});

// ---------------------------------------------------------------------------
// totalAmplitude
// ---------------------------------------------------------------------------

describe("totalAmplitude", () => {
  it("returns 0 for empty list", () => {
    expect(totalAmplitude([])).toBe(0);
  });

  it("sums all amplitudes", () => {
    const terms: Term[] = [
      { freq: 1, amp: 2, phase: 0 },
      { freq: 3, amp: 0.5, phase: 0 },
    ];
    expect(totalAmplitude(terms)).toBeCloseTo(2.5, 10);
  });
});
