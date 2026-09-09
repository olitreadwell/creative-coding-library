import { describe, it, expect } from "vitest";
import { makeRng } from "@/lib/creative/random";
import { makeGrid, step, countNeighbors } from "./life";

// Helper: build a grid from a 2D boolean array (row-major).
function fromCells(cells: number[][], cols: number, rows: number): Uint8Array {
  const grid = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r * cols + c] = cells[r]?.[c] ?? 0;
    }
  }
  return grid;
}

// Helper: extract a 2D snapshot from a flat grid.
function toCells(grid: Uint8Array, cols: number, rows: number): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(grid[r * cols + c] ?? 0);
    }
    out.push(row);
  }
  return out;
}

describe("makeGrid", () => {
  it("is deterministic: same seed produces the same grid", () => {
    const a = makeGrid(makeRng("life-seed"), 20, 20, 0.28);
    const b = makeGrid(makeRng("life-seed"), 20, 20, 0.28);
    expect(a).toEqual(b);
  });

  it("produces different grids for different seeds", () => {
    const a = makeGrid(makeRng("alpha"), 20, 20, 0.28);
    const b = makeGrid(makeRng("beta"), 20, 20, 0.28);
    expect(a).not.toEqual(b);
  });

  it("all values are 0 or 1", () => {
    const g = makeGrid(makeRng("valid"), 10, 10, 0.5);
    for (const v of g) {
      expect(v === 0 || v === 1).toBe(true);
    }
  });

  it("has length cols * rows", () => {
    const g = makeGrid(makeRng("size"), 15, 12, 0.3);
    expect(g.length).toBe(15 * 12);
  });
});

describe("step: empty grid stays empty", () => {
  it("an all-dead grid produces an all-dead next generation", () => {
    const cols = 10;
    const rows = 10;
    const empty = new Uint8Array(cols * rows);
    const next = step(empty, cols, rows);
    expect(next.every((v) => v === 0)).toBe(true);
  });
});

describe("step: 2x2 block is a still life", () => {
  // A 2x2 filled block is the simplest still life: each cell has exactly 3
  // neighbors, so all survive, and border dead cells have at most 2 neighbors.
  it("block does not change after one step", () => {
    // Use a 6x6 grid with the block centered to avoid wrap-around effects.
    const cols = 6;
    const rows = 6;
    // prettier-ignore
    const cells = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ];
    const grid = fromCells(cells, cols, rows);
    const next = step(grid, cols, rows);
    expect(toCells(next, cols, rows)).toEqual(cells);
  });

  it("block does not change after two steps", () => {
    const cols = 6;
    const rows = 6;
    // prettier-ignore
    const cells = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ];
    const grid = fromCells(cells, cols, rows);
    const gen2 = step(step(grid, cols, rows), cols, rows);
    expect(toCells(gen2, cols, rows)).toEqual(cells);
  });
});

describe("step: blinker oscillates with period 2", () => {
  // A horizontal blinker in row 2, cols 2-4 should become vertical and back.
  it("horizontal blinker becomes vertical after one step", () => {
    const cols = 7;
    const rows = 7;
    // prettier-ignore
    const horizontal = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ];
    // prettier-ignore
    const vertical = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ];
    const grid = fromCells(horizontal, cols, rows);
    const next = step(grid, cols, rows);
    expect(toCells(next, cols, rows)).toEqual(vertical);
  });

  it("blinker returns to horizontal after two steps", () => {
    const cols = 7;
    const rows = 7;
    // prettier-ignore
    const horizontal = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ];
    const grid = fromCells(horizontal, cols, rows);
    const gen2 = step(step(grid, cols, rows), cols, rows);
    expect(toCells(gen2, cols, rows)).toEqual(horizontal);
  });
});

describe("countNeighbors", () => {
  it("center cell of a full 3x3 block has 8 neighbors", () => {
    const cols = 3;
    const rows = 3;
    const allAlive = new Uint8Array(9).fill(1);
    // On a 3x3 toroidal grid every cell wraps into every other cell's neighbors.
    // The center cell (1,1) has 8 distinct neighbors.
    expect(countNeighbors(allAlive, 1, 1, cols, rows)).toBe(8);
  });

  it("isolated live cell has 0 neighbors", () => {
    const cols = 5;
    const rows = 5;
    const grid = new Uint8Array(25);
    grid[2 * 5 + 2] = 1; // center cell alive, all others dead
    expect(countNeighbors(grid, 2, 2, cols, rows)).toBe(0);
  });
});
