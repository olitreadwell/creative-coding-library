import { describe, it, expect } from "vitest";
import { makeRng } from "@/lib/creative/random";
import { makeGrid, step } from "./cyclic";

describe("makeGrid", () => {
  it("is deterministic: same seed produces the same grid", () => {
    const a = makeGrid(makeRng("cyclic-seed"), 20, 20, 5);
    const b = makeGrid(makeRng("cyclic-seed"), 20, 20, 5);
    expect(a).toEqual(b);
  });

  it("produces different grids for different seeds", () => {
    const a = makeGrid(makeRng("alpha"), 20, 20, 5);
    const b = makeGrid(makeRng("beta"), 20, 20, 5);
    expect(a).not.toEqual(b);
  });

  it("all values are within [0, states)", () => {
    const states = 5;
    const g = makeGrid(makeRng("valid"), 10, 10, states);
    for (const v of g) {
      expect(v >= 0 && v < states).toBe(true);
    }
  });

  it("has length cols * rows", () => {
    const g = makeGrid(makeRng("size"), 15, 12, 4);
    expect(g.length).toBe(15 * 12);
  });

  it("uses all states for large grids", () => {
    const states = 8;
    const g = makeGrid(makeRng("coverage"), 50, 50, states);
    const seen = new Set<number>();
    for (const v of g) {
      seen.add(v);
    }
    expect(seen.size).toBe(states);
  });
});

describe("step: cell advances when threshold neighbors match next state", () => {
  it("a cell with exactly threshold neighbors of next state advances", () => {
    // 5x5 grid, all cells state 0 except the center's 3 neighbors which are state 1.
    // Center cell is state 0; nextState = 1; threshold = 3.
    const cols = 5;
    const rows = 5;
    const states = 3;
    const threshold = 3;
    const grid = new Uint8Array(cols * rows);
    // Center cell at (2, 2) = index 2*5+2 = 12
    // Set three of its Moore neighbors to state 1:
    // (1,1)=6, (2,1)=7, (3,1)=8
    grid[1 * cols + 1] = 1;
    grid[1 * cols + 2] = 1;
    grid[1 * cols + 3] = 1;

    const next = step(grid, cols, rows, states, threshold);
    // Center cell (2,2): 3 neighbors of state 1 >= threshold 3, so it advances to 1
    expect(next[2 * cols + 2]).toBe(1);
  });

  it("a cell with fewer than threshold neighbors does not advance", () => {
    const cols = 5;
    const rows = 5;
    const states = 3;
    const threshold = 3;
    const grid = new Uint8Array(cols * rows);
    // Only 2 neighbors of state 1, threshold is 3 so center stays at 0
    grid[1 * cols + 1] = 1;
    grid[1 * cols + 2] = 1;

    const next = step(grid, cols, rows, states, threshold);
    expect(next[2 * cols + 2]).toBe(0);
  });

  it("states wrap correctly: state (states-1) advances to 0", () => {
    // A cell at state (states-1) should advance to 0 when neighbors hold 0.
    const cols = 5;
    const rows = 5;
    const states = 3;
    const threshold = 1;
    const grid = new Uint8Array(cols * rows);
    // Center at (2,2): set to state 2 (states-1)
    grid[2 * cols + 2] = 2;
    // One neighbor at state 0 (the next state for state 2 is 0)
    // (1,2) is already 0 by default
    const next = step(grid, cols, rows, states, threshold);
    // Center had state 2, nextState = 0, and at least 1 neighbor has state 0
    expect(next[2 * cols + 2]).toBe(0);
  });
});

describe("step: states stay within bounds", () => {
  it("all output values are within [0, states)", () => {
    const states = 6;
    const rng = makeRng("bounds-check");
    const grid = makeGrid(rng, 20, 20, states);
    const next = step(grid, 20, 20, states, 2);
    for (const v of next) {
      expect(v >= 0 && v < states).toBe(true);
    }
  });
});

describe("step: determinism", () => {
  it("same input always produces the same output", () => {
    const states = 5;
    const rng = makeRng("deterministic");
    const grid = makeGrid(rng, 15, 15, states);
    const a = step(grid, 15, 15, states, 3);
    const b = step(grid, 15, 15, states, 3);
    expect(a).toEqual(b);
  });
});
