import type { Rng } from "@/lib/creative/random";

export type Orientation = 0 | 1;

/**
 * Visual motif for each tile.
 * - "arcs"      — quarter-circle arcs connecting opposite edge midpoints (original).
 * - "diagonals" — straight lines crossing the tile corner-to-corner midpoints.
 * - "wedges"    — filled quarter-circle wedges in opposite corners.
 */
export type TileStyle = "arcs" | "diagonals" | "wedges";

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

/**
 * Draw a single Truchet tile using a selectable visual style.
 * Delegates to `drawTile` for "arcs"; implements "diagonals" and "wedges" inline.
 *
 * "diagonals": two straight stroked lines crossing the tile at the two possible
 *   orientations. Each line connects opposite edge midpoints through the tile.
 *
 * "wedges": two filled quarter-circle sectors at opposite corners — same geometry
 *   as arcs but filled instead of stroked, so the motif reads at any line width.
 *
 * @param ctx - Canvas 2D rendering context (already scaled for DPR)
 * @param x - Pixel x of tile top-left
 * @param y - Pixel y of tile top-left
 * @param size - Tile side length in pixels
 * @param orientation - 0 or 1
 * @param colorA - CSS color string for the first element
 * @param colorB - CSS color string for the second element
 * @param lineWidth - Stroke width in pixels (used by arcs and diagonals)
 * @param style - Visual motif ("arcs" | "diagonals" | "wedges")
 */
export function drawTileStyled(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  orientation: Orientation,
  colorA: string,
  colorB: string,
  lineWidth: number,
  style: TileStyle,
): void {
  if (style === "arcs") {
    drawTile(ctx, x, y, size, orientation, colorA, colorB, lineWidth);
    return;
  }

  const half = size / 2;
  const cx = x + half;
  const cy = y + half;

  if (style === "diagonals") {
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    if (orientation === 0) {
      // Top-left to bottom-right midpoints through center.
      ctx.beginPath();
      ctx.strokeStyle = colorA;
      ctx.moveTo(cx, y); // top edge midpoint
      ctx.lineTo(x, cy); // left edge midpoint
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = colorB;
      ctx.moveTo(cx, y + size); // bottom edge midpoint
      ctx.lineTo(x + size, cy); // right edge midpoint
      ctx.stroke();
    } else {
      // Top-right to bottom-left midpoints.
      ctx.beginPath();
      ctx.strokeStyle = colorA;
      ctx.moveTo(cx, y); // top edge midpoint
      ctx.lineTo(x + size, cy); // right edge midpoint
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = colorB;
      ctx.moveTo(cx, y + size); // bottom edge midpoint
      ctx.lineTo(x, cy); // left edge midpoint
      ctx.stroke();
    }
    return;
  }

  // style === "wedges": filled quarter-circle sectors at opposite corners.
  if (orientation === 0) {
    ctx.beginPath();
    ctx.fillStyle = colorA;
    ctx.moveTo(x, y);
    ctx.arc(x, y, half, 0, Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = colorB;
    ctx.moveTo(x + size, y + size);
    ctx.arc(x + size, y + size, half, Math.PI, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.fillStyle = colorA;
    ctx.moveTo(x + size, y);
    ctx.arc(x + size, y, half, Math.PI / 2, Math.PI);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = colorB;
    ctx.moveTo(x, y + size);
    ctx.arc(x, y + size, half, Math.PI * 1.5, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
}
