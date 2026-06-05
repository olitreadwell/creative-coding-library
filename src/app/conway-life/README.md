## What it is

A simulation of Conway's Game of Life: a grid of cells that live or die each generation based on how many live neighbors they have, seeded from a random starting state and rendered on an HTML canvas.

## Why this concept matters

The Game of Life shows how complex, lifelike behavior can emerge from a very small set of rules applied to a grid. No cell "knows" what its neighbors are planning. Each cell just follows four rules. Yet after a few generations you see patterns that glide across the screen, oscillate in place, or grow without end.

This is called **emergent behavior**: the interesting stuff is not built in anywhere. It appears because simple rules interact many times. Understanding emergence helps you think about ecosystems, traffic, neural networks, and markets, all of which behave in ways that none of their individual parts intended.

Practically, this app shows how to:

- Store simulation state as a flat typed array (`Uint8Array`) for cache-friendly access.
- Separate pure logic (`life.ts`) from rendering (`page.tsx`) so the rules are testable without a browser.
- Throttle a simulation loop inside `useAnimationFrame` using accumulated delta-time rather than a separate `setInterval`.
- Use a toroidal (wrapping) grid so cells at the edge of the canvas behave like cells in the center.

## Annotated key code

```ts
// life.ts: pure functions, no DOM

// All grid state is a flat Uint8Array: index = row * cols + col.
// 1 = alive, 0 = dead.

// Toroidal neighbor count: wrap col and row with modulo so edge cells
// connect to the opposite side of the grid.
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
      if (dr === 0 && dc === 0) continue; // skip self
      const nc = (((col + dc) % cols) + cols) % cols; // wrap x
      const nr = (((row + dr) % rows) + rows) % rows; // wrap y
      count += grid[idx(nc, nr, cols)] ?? 0;
    }
  }
  return count;
}

// B3/S23 rule: born with 3 neighbors, survives with 2 or 3.
const survives = alive ? n === 2 || n === 3 : n === 3;
next[idx(col, row, cols)] = survives ? 1 : 0;
```

## Attribution

Original code: written for this creative-coding library, 2026.

Reference: Game of Life invented by John Conway in 1970. See [Wikipedia: Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life).
