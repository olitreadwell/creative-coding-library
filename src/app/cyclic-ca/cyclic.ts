import type { Rng } from "@/lib/creative/random";

function idx(col: number, row: number, cols: number): number {
  return row * cols + col;
}

/**
 * Seed a grid with random states in [0, states).
 * Returns a flat Uint8Array of length cols * rows.
 */
export function makeGrid(rng: Rng, cols: number, rows: number, states: number): Uint8Array {
  const grid = new Uint8Array(cols * rows);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.floor(rng() * states);
  }
  return grid;
}

/**
 * Advance the cyclic CA one generation.
 *
 * Each cell holds a state in 0..states-1. State k is "eaten" by state (k+1) % states.
 * A cell advances to its next state if at least `threshold` of its 8 Moore neighbors
 * already hold that next state. The grid wraps toroidally.
 *
 * Returns a new Uint8Array; the input grid is not mutated.
 */
export function step(
  grid: Uint8Array,
  cols: number,
  rows: number,
  states: number,
  threshold: number,
): Uint8Array {
  const next = new Uint8Array(cols * rows);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const current = grid[idx(col, row, cols)] ?? 0;
      const nextState = (current + 1) % states;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nc = (((col + dc) % cols) + cols) % cols;
          const nr = (((row + dr) % rows) + rows) % rows;
          if ((grid[idx(nc, nr, cols)] ?? 0) === nextState) {
            count++;
          }
        }
      }
      next[idx(col, row, cols)] = count >= threshold ? nextState : current;
    }
  }
  return next;
}
