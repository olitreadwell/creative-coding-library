import { describe, it, expect } from "vitest";
import { nextRow, firstRow } from "./elementary";

describe("firstRow", () => {
  it("places a single 1 at the center (odd width)", () => {
    const row = firstRow(7, "center");
    expect(Array.from(row)).toEqual([0, 0, 0, 1, 0, 0, 0]);
  });

  it("places a single 1 at floor(width/2) for even width", () => {
    const row = firstRow(6, "center");
    expect(row[3]).toBe(1);
    expect(Array.from(row).filter((v) => v === 1)).toHaveLength(1);
  });

  it("encodes a numeric seed right-aligned", () => {
    // 0b1010 = 10 in a 4-cell row
    const row = firstRow(4, 0b1010);
    expect(Array.from(row)).toEqual([1, 0, 1, 0]);
  });

  it("defaults to center seed", () => {
    const explicit = firstRow(9, "center");
    const defaulted = firstRow(9);
    expect(Array.from(defaulted)).toEqual(Array.from(explicit));
  });
});

describe("nextRow", () => {
  it("preserves row length", () => {
    const row = new Uint8Array([0, 1, 0, 0, 1]);
    const next = nextRow(row, 30);
    expect(next.length).toBe(row.length);
  });

  it("rule 0: all cells become 0 regardless of input", () => {
    const mixed = new Uint8Array([1, 0, 1, 1, 0, 1]);
    const next = nextRow(mixed, 0);
    expect(Array.from(next)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("rule 255: all cells become 1 regardless of input", () => {
    const mixed = new Uint8Array([0, 1, 0, 0, 1, 0]);
    const next = nextRow(mixed, 255);
    expect(Array.from(next)).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("rule 90 from a centered seed generates the Sierpinski pattern", () => {
    // Rule 90: XOR of left and right neighbors.
    // Starting from a single centered cell on a width-7 grid:
    // Gen 0: 0001000
    // Gen 1: 0010100  (positions 2 and 4 become 1)
    // Gen 2: 0111010  (positions 1,2,3,4 become 1 except center)
    const gen0 = firstRow(7, "center");
    const gen1 = nextRow(gen0, 90);
    const gen2 = nextRow(gen1, 90);

    // Gen 1: cells 2 and 4 should be alive (0-indexed)
    expect(gen1[2]).toBe(1);
    expect(gen1[4]).toBe(1);
    // Center should be 0 (rule 90 maps 010 -> 0, since bit 2 = 0 in 0b01011010)
    expect(gen1[3]).toBe(0);

    // Gen 2: the pattern should be symmetric
    expect(gen2[1]).toBe(gen2[5]);
    expect(gen2[2]).toBe(gen2[4]);
    // Position 0 should be 0 (both neighbors 0 in gen1 at wrap = still 0)
    expect(gen2[0]).toBe(0);
  });

  it("rule 90: uses wraparound neighbors at edges", () => {
    // Width 4, single 1 at index 0. Left neighbor wraps to index 3 (0).
    // Neighborhood of cell 0: left=row[3]=0, center=row[0]=1, right=row[1]=0 -> 010 -> bit 2 of rule 90
    // Rule 90 = 0b01011010, bit 2 = 0, so cell 0 becomes 0.
    const row = new Uint8Array([1, 0, 0, 0]);
    const next = nextRow(row, 90);
    // cell 0: neighbors 0,1,0 -> pattern 010 -> bit2 of 90 = 0
    expect(next[0]).toBe(0);
    // cell 1: neighbors 1,0,0 -> pattern 100 -> bit4 of 90 = 1
    expect(next[1]).toBe(1);
    // cell 3: neighbors 0,0,1 -> pattern 001 -> bit1 of 90 = 1
    expect(next[3]).toBe(1);
  });

  it("rule 110 is known to be Turing-complete (smoke test, not dead)", () => {
    // Just verify it produces a non-trivial, non-zero row from a seed.
    const row = firstRow(20, "center");
    const next = nextRow(row, 110);
    const aliveCount = Array.from(next).reduce((s, v) => s + v, 0);
    expect(aliveCount).toBeGreaterThan(0);
    expect(aliveCount).toBeLessThan(20);
  });
});
