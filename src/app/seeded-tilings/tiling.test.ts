import { describe, it, expect } from "vitest";
import { makeRng } from "@/lib/creative/random";
import { tileGrid, gridDimensions } from "./tiling";

describe("gridDimensions", () => {
  it("returns exact column and row counts when canvas is evenly divisible", () => {
    const result = gridDimensions(800, 600, 40);
    expect(result.cols).toBe(20);
    expect(result.rows).toBe(15);
  });

  it("rounds up when canvas is not evenly divisible", () => {
    const result = gridDimensions(810, 610, 40);
    expect(result.cols).toBe(21);
    expect(result.rows).toBe(16);
  });

  it("returns at least 1 column and row for tiny canvas", () => {
    const result = gridDimensions(1, 1, 40);
    expect(result.cols).toBeGreaterThanOrEqual(1);
    expect(result.rows).toBeGreaterThanOrEqual(1);
  });
});

describe("tileGrid", () => {
  it("returns a grid with the correct number of rows", () => {
    const rng = makeRng("row-count");
    const grid = tileGrid(rng, 10, 8);
    expect(grid).toHaveLength(8);
  });

  it("returns rows that each have the correct number of columns", () => {
    const rng = makeRng("col-count");
    const grid = tileGrid(rng, 10, 8);
    for (const row of grid) {
      expect(row).toHaveLength(10);
    }
  });

  it("every cell is either 0 or 1", () => {
    const rng = makeRng("validity");
    const grid = tileGrid(rng, 12, 9);
    for (const row of grid) {
      for (const cell of row) {
        expect(cell === 0 || cell === 1).toBe(true);
      }
    }
  });

  it("is deterministic: same seed produces the same grid", () => {
    const gridA = tileGrid(makeRng("determinism"), 8, 6);
    const gridB = tileGrid(makeRng("determinism"), 8, 6);
    expect(gridA).toEqual(gridB);
  });

  it("produces different grids for different seeds", () => {
    const gridA = tileGrid(makeRng("seed-alpha"), 8, 6);
    const gridB = tileGrid(makeRng("seed-beta"), 8, 6);
    // Flatten and compare — statistically near-impossible to be equal.
    const flatA = gridA.flat().join("");
    const flatB = gridB.flat().join("");
    expect(flatA).not.toBe(flatB);
  });

  it("handles a 1x1 grid", () => {
    const rng = makeRng("one-cell");
    const grid = tileGrid(rng, 1, 1);
    expect(grid).toHaveLength(1);
    const firstRow = grid[0];
    expect(firstRow).toBeDefined();
    expect(firstRow).toHaveLength(1);
    const cell = firstRow?.[0];
    expect(cell === 0 || cell === 1).toBe(true);
  });
});
