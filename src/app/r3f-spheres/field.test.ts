import { describe, it, expect } from "vitest";
import { spherePositions, bob, WAVE_AMPLITUDE } from "./field";

const COLS = 12;
const ROWS = 12;
const SPACING = 1.4;

describe("spherePositions", () => {
  it("returns cols * rows entries", () => {
    const positions = spherePositions(COLS, ROWS, SPACING);
    expect(positions).toHaveLength(COLS * ROWS);
  });

  it("centers the grid around the origin (min x ≈ -max x)", () => {
    const positions = spherePositions(COLS, ROWS, SPACING);
    const xs = positions.map((p) => p.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    expect(Math.abs(minX + maxX)).toBeLessThan(1e-9);
  });

  it("centers the grid around the origin (min z ≈ -max z)", () => {
    const positions = spherePositions(COLS, ROWS, SPACING);
    const zs = positions.map((p) => p.z);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    expect(Math.abs(minZ + maxZ)).toBeLessThan(1e-9);
  });

  it("records correct col and row indices", () => {
    const positions = spherePositions(3, 2, 1);
    const first = positions[0];
    const last = positions[positions.length - 1];
    expect(first).toBeDefined();
    expect(last).toBeDefined();
    if (first) expect(first.col).toBe(0);
    if (first) expect(first.row).toBe(0);
    if (last) expect(last.col).toBe(2);
    if (last) expect(last.row).toBe(1);
  });

  it("returns an empty array for 0 cols", () => {
    expect(spherePositions(0, ROWS, SPACING)).toHaveLength(0);
  });
});

describe("bob", () => {
  it("is deterministic for the same inputs", () => {
    const a = bob(3, 5, 1.5);
    const b = bob(3, 5, 1.5);
    expect(a).toBe(b);
  });

  it("returns a value bounded within [-WAVE_AMPLITUDE, WAVE_AMPLITUDE]", () => {
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const y = bob(col, row, 0);
        expect(y).toBeGreaterThanOrEqual(-WAVE_AMPLITUDE - 1e-9);
        expect(y).toBeLessThanOrEqual(WAVE_AMPLITUDE + 1e-9);
      }
    }
  });

  it("returns different values for different positions at a fixed t", () => {
    const y0 = bob(0, 0, 0);
    const y1 = bob(5, 5, 0);
    expect(y0).not.toBeCloseTo(y1, 5);
  });

  it("changes over time for the same position", () => {
    const y0 = bob(3, 3, 0);
    const y1 = bob(3, 3, 1);
    expect(y0).not.toBeCloseTo(y1, 5);
  });
});
