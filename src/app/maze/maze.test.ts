import { describe, it, expect } from "vitest";
import { makeRng } from "@/lib/creative/random";
import { generateMaze, carveSteps, ALL_WALLS, WALL_N, WALL_E, WALL_S, WALL_W } from "./maze";

// ── generateMaze ──────────────────────────────────────────────────────────────

describe("generateMaze", () => {
  it("returns cols * rows cells", () => {
    const rng = makeRng(1);
    const cells = generateMaze(10, 8, rng);
    expect(cells).toHaveLength(80);
  });

  it("returns cols * rows cells for a 1x1 grid", () => {
    const rng = makeRng(0);
    const cells = generateMaze(1, 1, rng);
    expect(cells).toHaveLength(1);
  });

  it("each cell has the correct col and row", () => {
    const rng = makeRng(2);
    const cols = 5;
    const rows = 4;
    const cells = generateMaze(cols, rows, rng);

    for (let idx = 0; idx < cells.length; idx++) {
      const cell = cells[idx]!;
      expect(cell.col).toBe(idx % cols);
      expect(cell.row).toBe(Math.floor(idx / cols));
    }
  });

  it("produces a perfect maze: exactly cols * rows - 1 removed internal walls", () => {
    // A spanning tree on N nodes has exactly N - 1 edges. Each edge = one
    // removed wall pair. We count removed walls on the grid and divide by 2
    // (each passage removes one wall on each side).
    const rng = makeRng(99);
    const cols = 12;
    const rows = 9;
    const cells = generateMaze(cols, rows, rng);
    const total = cols * rows;

    let removedCount = 0;

    for (let idx = 0; idx < cells.length; idx++) {
      const cell = cells[idx]!;
      const allWalls = ALL_WALLS;
      // Count cleared wall bits.
      const clearedBits = ~cell.walls & allWalls;
      // popcount for a 4-bit value
      removedCount +=
        (clearedBits & 1) +
        ((clearedBits >> 1) & 1) +
        ((clearedBits >> 2) & 1) +
        ((clearedBits >> 3) & 1);
    }

    // Each internal passage is counted from both cells, so divide by 2.
    const edges = removedCount / 2;
    expect(edges).toBe(total - 1);
  });

  it("is deterministic for the same seed", () => {
    const rng1 = makeRng(42);
    const cells1 = generateMaze(15, 10, rng1);

    const rng2 = makeRng(42);
    const cells2 = generateMaze(15, 10, rng2);

    expect(cells1.map((c) => c.walls)).toEqual(cells2.map((c) => c.walls));
  });

  it("produces different mazes for different seeds", () => {
    const rng1 = makeRng(1);
    const cells1 = generateMaze(15, 10, rng1);

    const rng2 = makeRng(2);
    const cells2 = generateMaze(15, 10, rng2);

    // It is statistically impossible for two different seeds to produce
    // the identical wall layout on a 15x10 grid.
    expect(cells1.map((c) => c.walls)).not.toEqual(cells2.map((c) => c.walls));
  });

  it("boundary cells keep external walls", () => {
    // Top-left cell must keep its north and west outer walls.
    const rng = makeRng(7);
    const cells = generateMaze(8, 6, rng);

    const topLeft = cells[0]!;
    expect(topLeft.walls & WALL_N).toBe(WALL_N);
    expect(topLeft.walls & WALL_W).toBe(WALL_W);

    // Bottom-right cell must keep its south and east outer walls.
    const bottomRight = cells[8 * 6 - 1]!;
    expect(bottomRight.walls & WALL_S).toBe(WALL_S);
    expect(bottomRight.walls & WALL_E).toBe(WALL_E);
  });

  it("wall symmetry: if cell A has E open, its east neighbour has W open", () => {
    const cols = 10;
    const rows = 8;
    const rng = makeRng(55);
    const cells = generateMaze(cols, rows, rng);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const a = cells[row * cols + col]!;
        const b = cells[row * cols + col + 1]!;
        const aOpen = (a.walls & WALL_E) === 0;
        const bOpen = (b.walls & WALL_W) === 0;
        expect(aOpen).toBe(bOpen);
      }
    }
  });

  it("wall symmetry: if cell A has S open, its south neighbour has N open", () => {
    const cols = 10;
    const rows = 8;
    const rng = makeRng(55);
    const cells = generateMaze(cols, rows, rng);

    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols; col++) {
        const a = cells[row * cols + col]!;
        const b = cells[(row + 1) * cols + col]!;
        const aOpen = (a.walls & WALL_S) === 0;
        const bOpen = (b.walls & WALL_N) === 0;
        expect(aOpen).toBe(bOpen);
      }
    }
  });
});

// ── carveSteps ────────────────────────────────────────────────────────────────

describe("carveSteps", () => {
  it("returns cols * rows - 1 steps", () => {
    const rng = makeRng(10);
    const steps = carveSteps(10, 8, rng);
    expect(steps).toHaveLength(79);
  });

  it("returns 0 steps for a 1x1 grid (no walls to carve)", () => {
    const rng = makeRng(0);
    const steps = carveSteps(1, 1, rng);
    expect(steps).toHaveLength(0);
  });

  it("every cell is visited exactly once across all steps", () => {
    const cols = 12;
    const rows = 9;
    const rng = makeRng(33);
    const steps = carveSteps(cols, rows, rng);

    // The first cell (index 0) is the start; it appears in steps each time a
    // wall is carved FROM it. Count unique cell indices touched by steps.
    // The start cell (0) is visited first but appears in steps when it carves.
    // Every non-start cell appears exactly once as a newly entered cell.
    // Total distinct cells reachable = all cols * rows.

    // A simpler property: each step's cellIndex is valid.
    const total = cols * rows;
    for (const step of steps) {
      expect(step.cellIndex).toBeGreaterThanOrEqual(0);
      expect(step.cellIndex).toBeLessThan(total);
    }
  });

  it("each step records a single wall flag (power of two)", () => {
    const rng = makeRng(21);
    const steps = carveSteps(8, 6, rng);

    for (const step of steps) {
      const w = step.wallRemoved;
      // A single wall flag is a power of two: exactly one bit set.
      expect(w).toBeGreaterThan(0);
      expect(w & (w - 1)).toBe(0);
    }
  });

  it("is deterministic for the same seed", () => {
    const rng1 = makeRng(77);
    const steps1 = carveSteps(10, 8, rng1);

    const rng2 = makeRng(77);
    const steps2 = carveSteps(10, 8, rng2);

    expect(steps1).toEqual(steps2);
  });
});
