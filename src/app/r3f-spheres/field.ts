import { TAU } from "@/lib/creative/math";

export type SpherePosition = {
  x: number;
  z: number;
  col: number;
  row: number;
};

const WAVE_AMPLITUDE = 0.6;
const WAVE_SPATIAL_FREQ = 0.4;
const WAVE_TEMPORAL_FREQ = 1.2;

/**
 * Generate centered grid positions for a cols x rows sphere field.
 *
 * @param cols - Number of columns
 * @param rows - Number of rows
 * @param spacing - Distance between sphere centers
 * @returns Array of sphere positions centered around the origin
 */
export function spherePositions(cols: number, rows: number, spacing: number): SpherePosition[] {
  const halfW = ((cols - 1) * spacing) / 2;
  const halfD = ((rows - 1) * spacing) / 2;
  const positions: SpherePosition[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: col * spacing - halfW,
        z: row * spacing - halfD,
        col,
        row,
      });
    }
  }

  return positions;
}

/**
 * Compute the vertical (Y) offset for a sphere at (col, row) at time t.
 * Produces a traveling sine wave across the grid.
 *
 * @param col - Column index of the sphere
 * @param row - Row index of the sphere
 * @param t - Time in seconds
 * @returns Y offset within [-WAVE_AMPLITUDE, WAVE_AMPLITUDE]
 */
export function bob(col: number, row: number, t: number): number {
  const phase = (col + row) * WAVE_SPATIAL_FREQ;
  return Math.sin(phase - t * WAVE_TEMPORAL_FREQ) * WAVE_AMPLITUDE;
}

export { WAVE_AMPLITUDE };
export const GRID_COLS = 12;
export const GRID_ROWS = 12;
export const SPHERE_SPACING = 1.4;
export const HUE_RANGE: [number, number] = [180, 320];
export { TAU };
