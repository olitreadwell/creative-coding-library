import type { Rng } from "@/lib/creative/random";

/**
 * Returns the index into a flat Uint8Array for grid position (col, row).
 * All grid state is stored as a flat array to avoid per-row allocations.
 */
function idx(col: number, row: number, cols: number): number {
  return row * cols + col;
}

/**
 * Count live neighbors of cell (col, row) on a toroidal (wrapping) grid.
 * Toroidal means cells on the right edge are adjacent to cells on the left,
 * and cells on the bottom edge are adjacent to cells on the top.
 */
export function countNeighbors(
  grid: Uint8Array,
  col: number,
  row: number,
  cols: number,
  rows: number,
): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nc = (((col + dc) % cols) + cols) % cols;
      const nr = (((row + dr) % rows) + rows) % rows;
      count += grid[idx(nc, nr, cols)] ?? 0;
    }
  }
  return count;
}

/**
 * Seed a grid with live cells at approximately `density` probability per cell.
 * Returns a flat Uint8Array of length cols * rows; 1 = alive, 0 = dead.
 *
 * @param rng    - A seeded Rng from makeRng
 * @param cols   - Number of columns
 * @param rows   - Number of rows
 * @param density - Fraction of cells to start alive (0-1), typically ~0.28
 */
export function makeGrid(rng: Rng, cols: number, rows: number, density: number): Uint8Array {
  const grid = new Uint8Array(cols * rows);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = rng() < density ? 1 : 0;
  }
  return grid;
}

/**
 * Advance the grid one generation using Conway's rules:
 *   - A live cell with 2 or 3 live neighbors survives.
 *   - A dead cell with exactly 3 live neighbors becomes alive.
 *   - All other cells die or stay dead.
 *
 * Returns a new Uint8Array; the input grid is not mutated.
 */
export function step(grid: Uint8Array, cols: number, rows: number): Uint8Array {
  const next = new Uint8Array(cols * rows);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const alive = (grid[idx(col, row, cols)] ?? 0) === 1;
      const n = countNeighbors(grid, col, row, cols, rows);
      // Conway's B3/S23 rule
      const survives = alive ? n === 2 || n === 3 : n === 3;
      next[idx(col, row, cols)] = survives ? 1 : 0;
    }
  }
  return next;
}
