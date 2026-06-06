import { TAU, map } from "@/lib/creative/math";

export type GridCell = {
  x: number;
  y: number;
  row: number;
  col: number;
};

/**
 * Returns pixel-center positions for each cell in a cols x rows grid.
 * x spans [cellW/2, cols*cellW - cellW/2], same for y.
 */
export function gridPositions(
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: col * cellW + cellW / 2,
        y: row * cellH + cellH / 2,
        row,
        col,
      });
    }
  }
  return cells;
}

/**
 * Euclidean distance from a cell's (row,col) to the grid center.
 * Normalised so the maximum possible value is 1.
 */
export function centerDistance(row: number, col: number, cols: number, rows: number): number {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const dx = col - cx;
  const dy = row - cy;
  const raw = Math.sqrt(dx * dx + dy * dy);
  const maxRaw = Math.sqrt(cx * cx + cy * cy);
  return maxRaw === 0 ? 0 : raw / maxRaw;
}

/**
 * Returns a scale multiplier [minScale, maxScale] that ripples outward
 * from the center based on distance and a time offset (radians).
 * The wave travels: cells further from center lag by distance * spread.
 */
export function pulseScale(
  distance: number,
  time: number,
  spread = TAU * 1.5,
  minScale = 0.5,
  maxScale = 1.2,
): number {
  const phase = time - distance * spread;
  const t = (Math.sin(phase) + 1) / 2; // 0..1
  return map(t, 0, 1, minScale, maxScale);
}
