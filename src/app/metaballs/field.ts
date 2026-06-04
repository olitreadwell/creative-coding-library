/**
 * Pure metaballs math. No DOM imports — safe to run in any environment.
 *
 * A "metaball" is a blob defined by an influence function: the closer you are
 * to the ball's center, the higher the value. Adding several balls together
 * gives a scalar field. Where that field crosses a threshold (the iso-value),
 * blobs appear to merge and split organically.
 */

/** A single metaball: center (x, y) and radius r. */
export type Ball = {
  x: number;
  y: number;
  r: number;
};

/**
 * A line segment returned by marching squares — two endpoints in canvas space.
 */
export type Segment = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

/**
 * Samples the scalar field at world position (x, y) by summing each ball's
 * influence. The influence of ball b at distance d is `b.r^2 / d^2`, which
 * falls off with the inverse-square law and lets you use radius directly as
 * a strength knob. Returns 0 when there are no balls.
 *
 * @param balls - Array of metaballs contributing to the field
 * @param x - World x to sample
 * @param y - World y to sample
 * @returns Scalar field value (higher means closer to a ball)
 */
export function fieldAt(balls: readonly Ball[], x: number, y: number): number {
  let sum = 0;
  for (const ball of balls) {
    const dx = x - ball.x;
    const dy = y - ball.y;
    const d2 = dx * dx + dy * dy;
    // Guard against singularity when sampling exactly at the center.
    if (d2 < 1e-10) {
      sum += ball.r * ball.r * 1e10;
    } else {
      sum += (ball.r * ball.r) / d2;
    }
  }
  return sum;
}

// ---------------------------------------------------------------------------
// Marching squares iso-contour
// ---------------------------------------------------------------------------

/**
 * Linear interpolation of the crossing position along an edge.
 * Given field values `a` and `b` at t=0 and t=1, returns the t where the
 * field equals `threshold`.
 */
function isoCross(a: number, b: number, threshold: number): number {
  const range = b - a;
  if (Math.abs(range) < 1e-12) return 0.5;
  return (threshold - a) / range;
}

/**
 * Runs classic marching squares over a sampled scalar field, returning the
 * set of line segments that trace the iso-contour at `threshold`.
 *
 * The field is provided as a flat `Float32Array` of size `cols * rows`, laid
 * out in row-major order (row 0 first, then row 1, …). Each sample is at the
 * corner of a cell. A cell at grid position (col, row) has its top-left corner
 * at sample index `row * cols + col`.
 *
 * Each cell is classified by a 4-bit case (bit 3 = top-left, bit 2 = top-right,
 * bit 1 = bottom-right, bit 0 = bottom-left), where a bit is 1 when the
 * sample is above the threshold. The full 16 cases are handled, including both
 * saddle-point ambiguous cases (5 and 10), resolved by averaging.
 *
 * @param values - Row-major scalar field; length must equal cols * rows
 * @param cols - Number of sample columns (grid width in samples)
 * @param rows - Number of sample rows (grid height in samples)
 * @param cellSize - World-space width/height of one cell
 * @param threshold - Iso-value; contour is drawn where field == threshold
 * @returns Array of line segments in world space (pixels if cellSize is pixels)
 */
export function marchingSquares(
  values: Float32Array,
  cols: number,
  rows: number,
  cellSize: number,
  threshold: number,
): Segment[] {
  const segments: Segment[] = [];

  // Iterate over every cell. A cell is bounded by cols-1 × rows-1 samples.
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      // Corner indices in the flat array.
      const iTL = row * cols + col;
      const iTR = row * cols + col + 1;
      const iBL = (row + 1) * cols + col;
      const iBR = (row + 1) * cols + col + 1;

      // noUncheckedIndexedAccess: values[i] can be undefined if out of range.
      // We guard at the loop bounds (row < rows-1, col < cols-1), so the
      // four accesses are always within the allocated buffer.
      const vTL = values[iTL] ?? 0;
      const vTR = values[iTR] ?? 0;
      const vBL = values[iBL] ?? 0;
      const vBR = values[iBR] ?? 0;

      // Build the 4-bit case index.
      // Bit 3 = TL, bit 2 = TR, bit 1 = BR, bit 0 = BL.
      const caseIdx =
        (vTL >= threshold ? 8 : 0) |
        (vTR >= threshold ? 4 : 0) |
        (vBR >= threshold ? 2 : 0) |
        (vBL >= threshold ? 1 : 0);

      if (caseIdx === 0 || caseIdx === 15) continue; // fully outside or inside

      // World-space corners of this cell.
      const x0 = col * cellSize;
      const y0 = row * cellSize;
      const x1 = x0 + cellSize;
      const y1 = y0 + cellSize;

      // Interpolated edge midpoints (only computed when needed).
      // Edge naming: T=top, R=right, B=bottom, L=left.
      const tT = isoCross(vTL, vTR, threshold); // top edge
      const tR = isoCross(vTR, vBR, threshold); // right edge
      const tB = isoCross(vBR, vBL, threshold); // bottom edge (right to left)
      const tL = isoCross(vTL, vBL, threshold); // left edge (top to bottom)

      const eT: [number, number] = [x0 + tT * cellSize, y0];
      const eR: [number, number] = [x1, y0 + tR * cellSize];
      const eB: [number, number] = [x1 - tB * cellSize, y1];
      const eL: [number, number] = [x0, y0 + tL * cellSize];

      /**
       * Pushes a segment from point p0 to point p1.
       */
      const push = (p0: [number, number], p1: [number, number]): void => {
        segments.push({ x0: p0[0], y0: p0[1], x1: p1[0], y1: p1[1] });
      };

      // Classic 16-case lookup. Saddle cases 5 and 10 use average-of-centers
      // heuristic: pick the split that follows the steeper gradient.
      switch (caseIdx) {
        case 1:
          push(eL, eB);
          break;
        case 2:
          push(eB, eR);
          break;
        case 3:
          push(eL, eR);
          break;
        case 4:
          push(eT, eR);
          break;
        case 5:
          // Saddle: TL and BR are inside. Resolve by field average.
          if (vTL + vBR > vTR + vBL) {
            push(eT, eR);
            push(eL, eB);
          } else {
            push(eT, eL);
            push(eB, eR);
          }
          break;
        case 6:
          push(eT, eB);
          break;
        case 7:
          push(eT, eL);
          break;
        case 8:
          push(eT, eL);
          break;
        case 9:
          push(eT, eB);
          break;
        case 10:
          // Saddle: TR and BL are inside. Resolve by field average.
          if (vTR + vBL > vTL + vBR) {
            push(eT, eL);
            push(eB, eR);
          } else {
            push(eT, eR);
            push(eL, eB);
          }
          break;
        case 11:
          push(eT, eR);
          break;
        case 12:
          push(eL, eR);
          break;
        case 13:
          push(eB, eR);
          break;
        case 14:
          push(eL, eB);
          break;
        // case 0 and 15 already handled above.
      }
    }
  }

  return segments;
}
