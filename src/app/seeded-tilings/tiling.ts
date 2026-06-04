import type { Rng } from "@/lib/creative/random";

export type Orientation = 0 | 1;

export type GridDimensions = {
  cols: number;
  rows: number;
};

/**
 * Returns how many tiles fit across and down for a given canvas size.
 * Tiles that would extend beyond the canvas are still included so the
 * grid fills the full area even if the canvas is not evenly divisible.
 */
export function gridDimensions(width: number, height: number, tileSize: number): GridDimensions {
  return {
    cols: Math.ceil(width / tileSize),
    rows: Math.ceil(height / tileSize),
  };
}

/**
 * Builds a rows x cols grid of tile orientations using a seeded PRNG.
 * Orientation 0: arcs connect top-left and bottom-right edge midpoints.
 * Orientation 1: arcs connect top-right and bottom-left edge midpoints.
 * The same rng + same dimensions always produce the same grid.
 *
 * @param rng - A seeded random number generator (use makeRng from @/lib/creative/random)
 * @param cols - Number of columns
 * @param rows - Number of rows
 * @returns A 2-D array [row][col] of orientations
 */
export function tileGrid(rng: Rng, cols: number, rows: number): Orientation[][] {
  const grid: Orientation[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Orientation[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(rng() < 0.5 ? 0 : 1);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Draw a single Truchet tile onto the given context at pixel position (x, y).
 * Each tile draws two quarter-circle arcs that connect opposite edge midpoints.
 * In orientation 0 the arcs curve through the top-left and bottom-right corners.
 * In orientation 1 they curve through the top-right and bottom-left corners.
 *
 * This is a pure drawing helper — no state changes beyond ctx path ops.
 *
 * @param ctx - Canvas 2D rendering context (already scaled for DPR)
 * @param x - Pixel x of tile top-left
 * @param y - Pixel y of tile top-left
 * @param size - Tile side length in pixels
 * @param orientation - 0 or 1
 * @param colorA - CSS color string for the first arc
 * @param colorB - CSS color string for the second arc
 * @param lineWidth - Stroke width in pixels
 */
export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  orientation: Orientation,
  colorA: string,
  colorB: string,
  lineWidth: number,
): void {
  const half = size / 2;

  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  if (orientation === 0) {
    // Arc 1: top-left corner, radius = half, from right midpoint of top edge
    // to bottom midpoint of left edge (quarter circle).
    ctx.beginPath();
    ctx.strokeStyle = colorA;
    ctx.arc(x, y, half, 0, Math.PI / 2);
    ctx.stroke();

    // Arc 2: bottom-right corner, same radius, completes the pair.
    ctx.beginPath();
    ctx.strokeStyle = colorB;
    ctx.arc(x + size, y + size, half, Math.PI, Math.PI * 1.5);
    ctx.stroke();
  } else {
    // Arc 1: top-right corner.
    ctx.beginPath();
    ctx.strokeStyle = colorA;
    ctx.arc(x + size, y, half, Math.PI / 2, Math.PI);
    ctx.stroke();

    // Arc 2: bottom-left corner.
    ctx.beginPath();
    ctx.strokeStyle = colorB;
    ctx.arc(x, y + size, half, Math.PI * 1.5, Math.PI * 2);
    ctx.stroke();
  }
}
