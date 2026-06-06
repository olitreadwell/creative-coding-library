## What it is

A seeded Truchet-tile generator that fills a canvas with quarter-circle arcs whose orientations are chosen by a reproducible random number generator, forming flowing continuous curves across the grid.

## Why this concept matters

Seeded randomness means the "random" choices in a generative artwork are controlled by a single number called a seed. Give the program the same seed and it always produces exactly the same image. This is important because:

- You can share a seed with someone and they see the same result you do.
- You can iterate on the visual style while keeping the layout frozen.
- The artwork is infinite (infinite seeds, infinite patterns) but also reproducible.

Traditional Truchet tiles were invented by a French mathematician in 1704. The "Smith" variant used here places two quarter-circle arcs in each square tile. Because adjacent tiles share edge midpoints, the arcs join into long curving paths that look organic even though every choice is deterministic.

## Annotated key code

```ts
// tiling.ts — pure functions, no DOM

// Each tile is one of two orientations: arcs curve toward opposite corners.
export type Orientation = 0 | 1;

// Build a rows × cols grid — same rng + same size always gives the same grid.
export function tileGrid(rng: Rng, cols: number, rows: number): Orientation[][] {
  const grid: Orientation[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Orientation[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(rng() < 0.5 ? 0 : 1); // coin flip per tile
    }
    grid.push(row);
  }
  return grid;
}

// Draw one tile: two quarter-circle arcs using canvas arc().
// Orientation 0 curves through top-left and bottom-right corners.
// Orientation 1 curves through top-right and bottom-left corners.
// Adjacent tiles share edge midpoints, so arcs connect continuously.
ctx.arc(x, y, half, 0, Math.PI / 2); // top-left corner arc
ctx.arc(x + size, y + size, half, Math.PI, Math.PI * 1.5); // bottom-right
```

The color palette is also seeded: a base hue is picked from the seed, and a complementary hue roughly 150-210 degrees away provides the second arc color. This makes each seed have a unique but harmonious color pair.

## Attribution

Original code: written for this creative-coding library, 2026.

Reference: Truchet tiles concept by Sebastien Truchet (1704), popularized as a generative art technique via Cyril Stanley Smith's 1987 commentary. See [Wikipedia: Truchet tiles](https://en.wikipedia.org/wiki/Truchet_tiles).
