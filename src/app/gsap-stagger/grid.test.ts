import { describe, it, expect } from "vitest";
import { gridCells, centerDistance, cellsByDistance } from "./grid";

describe("gridCells", () => {
  it("returns cols * rows cells", () => {
    expect(gridCells(12, 8)).toHaveLength(96);
    expect(gridCells(3, 4)).toHaveLength(12);
    expect(gridCells(1, 1)).toHaveLength(1);
  });

  it("assigns sequential index values", () => {
    const cells = gridCells(4, 3);
    cells.forEach((cell, i) => {
      expect(cell.index).toBe(i);
    });
  });

  it("maps row and col correctly", () => {
    const cells = gridCells(4, 3);
    const first = cells[0];
    const last = cells[cells.length - 1];

    expect(first).toBeDefined();
    expect(last).toBeDefined();

    if (first) {
      expect(first.row).toBe(0);
      expect(first.col).toBe(0);
    }
    if (last) {
      expect(last.row).toBe(2);
      expect(last.col).toBe(3);
    }
  });

  it("increments col within a row", () => {
    const cells = gridCells(5, 2);
    const row0 = cells.slice(0, 5);
    row0.forEach((cell, i) => {
      expect(cell.row).toBe(0);
      expect(cell.col).toBe(i);
    });
  });

  it("increments row after each stride", () => {
    const cells = gridCells(3, 3);
    expect(cells[3]?.row).toBe(1);
    expect(cells[6]?.row).toBe(2);
  });
});

describe("centerDistance", () => {
  it("returns 0 for the center of a 1x1 grid", () => {
    expect(centerDistance(0, 0, 1, 1)).toBe(0);
  });

  it("returns equal distance for symmetric corners", () => {
    const d00 = centerDistance(0, 0, 4, 4);
    const d33 = centerDistance(3, 3, 4, 4);
    expect(d00).toBeCloseTo(d33);
  });

  it("center cell of odd grid has distance 0", () => {
    expect(centerDistance(2, 2, 5, 5)).toBeCloseTo(0);
  });
});

describe("cellsByDistance", () => {
  it("returns same total count as gridCells", () => {
    expect(cellsByDistance(6, 4)).toHaveLength(24);
  });

  it("first cell is closest to center", () => {
    const sorted = cellsByDistance(5, 5);
    const first = sorted[0];
    expect(first).toBeDefined();
    if (first) {
      const d = centerDistance(first.row, first.col, 5, 5);
      expect(d).toBeCloseTo(0);
    }
  });

  it("distances are non-decreasing", () => {
    const sorted = cellsByDistance(6, 4);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev && curr) {
        const dp = centerDistance(prev.row, prev.col, 6, 4);
        const dc = centerDistance(curr.row, curr.col, 6, 4);
        expect(dc).toBeGreaterThanOrEqual(dp - 1e-9);
      }
    }
  });
});
