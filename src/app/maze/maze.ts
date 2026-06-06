/**
 * Pure maze generation. No DOM imports — safe in any environment.
 *
 * Implements the recursive backtracker (depth-first search) using an explicit
 * stack so there is no call-stack limit. Given the same `rng`, the output is
 * fully deterministic.
 *
 * Grid layout: cells are stored row-major — index = row * cols + col.
 * (0,0) is the top-left corner. col increases right, row increases down.
 */

import type { Rng } from "@/lib/creative/random";
import { randInt } from "@/lib/creative/random";

// ── Wall flags ────────────────────────────────────────────────────────────────
//
// Each bit represents one wall. A wall is present (1) until carved away (0).
//
export const WALL_N = 0b0001 as const;
export const WALL_E = 0b0010 as const;
export const WALL_S = 0b0100 as const;
export const WALL_W = 0b1000 as const;
export const ALL_WALLS = WALL_N | WALL_E | WALL_S | WALL_W;

export type WallFlags = number; // bitmask of WALL_* constants

export type Cell = {
  /** Column index (0-based, left to right). */
  col: number;
  /** Row index (0-based, top to bottom). */
  row: number;
  /** Current wall state — bitfield of WALL_* flags. A cleared bit = open passage. */
  walls: WallFlags;
};

// ── Step type (for animation) ─────────────────────────────────────────────────

/** One carve event: the algorithm visited `cell` and removed `wall` from it. */
export type Step = {
  /** Flat index of the cell that was visited. */
  cellIndex: number;
  /** The wall flag that was removed from this cell on this visit (or 0 on init). */
  wallRemoved: WallFlags;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

type Direction = {
  wall: WallFlags;
  opposite: WallFlags;
  dCol: number;
  dRow: number;
};

const DIRECTIONS: readonly Direction[] = [
  { wall: WALL_N, opposite: WALL_S, dCol: 0, dRow: -1 },
  { wall: WALL_E, opposite: WALL_W, dCol: 1, dRow: 0 },
  { wall: WALL_S, opposite: WALL_N, dCol: 0, dRow: 1 },
  { wall: WALL_W, opposite: WALL_E, dCol: -1, dRow: 0 },
];

/** Returns the flat grid index, or -1 if out of bounds. */
function indexOf(col: number, row: number, cols: number, rows: number): number {
  if (col < 0 || col >= cols || row < 0 || row >= rows) return -1;
  return row * cols + col;
}

/**
 * Fisher-Yates in-place shuffle using the provided rng.
 * Operates on a copy so the caller's array is not mutated.
 */
function shuffled<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i + 1);
    // noUncheckedIndexedAccess: guard with non-null assertion justified
    // because i and j are always in-bounds by construction above.
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

// ── Core algorithm ────────────────────────────────────────────────────────────

/**
 * Runs the recursive backtracker maze carver and returns both the completed
 * grid and the ordered list of carve steps (for step-by-step replay).
 *
 * @param cols - Number of columns (>= 1)
 * @param rows - Number of rows (>= 1)
 * @param rng  - Seeded PRNG; determines the maze shape deterministically
 */
function runBacktracker(cols: number, rows: number, rng: Rng): { cells: Cell[]; steps: Step[] } {
  const total = cols * rows;

  // Initialise every cell with all four walls intact.
  const cells: Cell[] = Array.from({ length: total }, (_, idx) => ({
    col: idx % cols,
    row: Math.floor(idx / cols),
    walls: ALL_WALLS,
  }));

  const visited = new Uint8Array(total); // 0 = unvisited, 1 = visited
  const stack: number[] = [];
  const steps: Step[] = [];

  // Start from the top-left cell.
  const startIdx = 0;
  visited[startIdx] = 1;
  stack.push(startIdx);

  while (stack.length > 0) {
    const currentIdx = stack[stack.length - 1] as number;
    const current = cells[currentIdx] as Cell;

    // Find all unvisited neighbours in a random order.
    const dirs = shuffled(DIRECTIONS, rng);
    let carved = false;

    for (const dir of dirs) {
      const nCol = current.col + dir.dCol;
      const nRow = current.row + dir.dRow;
      const nIdx = indexOf(nCol, nRow, cols, rows);

      if (nIdx === -1) continue; // out of bounds
      if (visited[nIdx] === 1) continue; // already visited

      // Carve: remove the wall on the current side and the opposite wall on
      // the neighbour.
      (cells[currentIdx] as Cell).walls &= ~dir.wall;
      (cells[nIdx] as Cell).walls &= ~dir.opposite;

      steps.push({ cellIndex: currentIdx, wallRemoved: dir.wall });

      visited[nIdx] = 1;
      stack.push(nIdx);
      carved = true;
      break; // explore the new cell before trying other neighbours
    }

    if (!carved) {
      // Dead end: backtrack.
      stack.pop();
    }
  }

  return { cells, steps };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a perfect maze (a spanning tree of the grid) using the recursive
 * backtracker algorithm with an iterative stack.
 *
 * A perfect maze has exactly one path between any two cells and no loops.
 *
 * @param cols - Number of columns (>= 1)
 * @param rows - Number of rows (>= 1)
 * @param rng  - Seeded PRNG from `makeRng(seed)`
 * @returns Flat row-major array of `Cell` objects (length = cols * rows)
 *
 * @example
 * const rng = makeRng(42);
 * const cells = generateMaze(20, 15, rng);
 */
export function generateMaze(cols: number, rows: number, rng: Rng): Cell[] {
  const { cells } = runBacktracker(cols, rows, rng);
  return cells;
}

/**
 * Returns the ordered carve steps produced while building the maze. Each step
 * records which cell was visited and which wall was removed, so a play page
 * can replay the carving animation frame by frame.
 *
 * The underlying maze is identical to the one `generateMaze` would produce for
 * the same arguments — the two functions share the same algorithm; this one
 * just exposes the intermediate state.
 *
 * @param cols - Number of columns (>= 1)
 * @param rows - Number of rows (>= 1)
 * @param rng  - Seeded PRNG from `makeRng(seed)`
 * @returns Array of `Step` objects in visitation order (length = cols * rows - 1)
 *
 * @example
 * const rng = makeRng(42);
 * const steps = carveSteps(20, 15, rng);
 */
export function carveSteps(cols: number, rows: number, rng: Rng): Step[] {
  const { steps } = runBacktracker(cols, rows, rng);
  return steps;
}
