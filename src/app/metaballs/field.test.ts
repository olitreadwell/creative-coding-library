import { describe, it, expect } from "vitest";
import { fieldAt, marchingSquares } from "./field";
import type { Ball } from "./field";

// ---------------------------------------------------------------------------
// fieldAt
// ---------------------------------------------------------------------------

describe("fieldAt", () => {
  const ball: Ball = { x: 50, y: 50, r: 10 };

  it("returns a higher value near the ball center than far away", () => {
    const near = fieldAt([ball], 51, 50);
    const far = fieldAt([ball], 200, 200);
    expect(near).toBeGreaterThan(far);
  });

  it("returns 0 when there are no balls", () => {
    expect(fieldAt([], 0, 0)).toBe(0);
  });

  it("sums contributions from multiple balls", () => {
    const a: Ball = { x: 0, y: 0, r: 10 };
    const b: Ball = { x: 100, y: 0, r: 10 };
    const single = fieldAt([a], 50, 0);
    const both = fieldAt([a, b], 50, 0);
    // At x=50 both balls are equidistant, so together they contribute more.
    expect(both).toBeGreaterThan(single);
  });

  it("handles sampling exactly at the ball center without throwing", () => {
    const result = fieldAt([ball], 50, 50);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });

  it("is deterministic — same input produces same output", () => {
    const a = fieldAt([ball], 60, 55);
    const b = fieldAt([ball], 60, 55);
    expect(a).toBe(b);
  });

  it("returns a larger value for a bigger radius at the same distance", () => {
    const smallBall: Ball = { x: 0, y: 0, r: 5 };
    const largeBall: Ball = { x: 0, y: 0, r: 20 };
    const smallVal = fieldAt([smallBall], 10, 0);
    const largeVal = fieldAt([largeBall], 10, 0);
    expect(largeVal).toBeGreaterThan(smallVal);
  });
});

// ---------------------------------------------------------------------------
// marchingSquares
// ---------------------------------------------------------------------------

describe("marchingSquares", () => {
  /**
   * Builds a cols×rows Float32Array where every cell is filled with
   * `fillValue`, except the four corners of a rect centred in the grid
   * are set to `hotValue`.
   */
  function makeUniformField(cols: number, rows: number, fillValue: number): Float32Array {
    return new Float32Array(cols * rows).fill(fillValue);
  }

  it("returns no segments when all values are below the threshold", () => {
    const values = makeUniformField(5, 5, 0.5);
    const segs = marchingSquares(values, 5, 5, 10, 1.0);
    expect(segs).toHaveLength(0);
  });

  it("returns no segments when all values are above the threshold (fully inside)", () => {
    const values = makeUniformField(5, 5, 2.0);
    const segs = marchingSquares(values, 5, 5, 10, 1.0);
    expect(segs).toHaveLength(0);
  });

  it("returns at least one segment when the threshold is crossed", () => {
    // A 3×3 grid where the center sample is above threshold; edges are below.
    // Grid:
    //  0  0  0
    //  0  2  0
    //  0  0  0
    const values = new Float32Array(9).fill(0);
    // index of center in 3×3 = row 1, col 1 => 1*3 + 1 = 4
    values[4] = 2.0;
    const segs = marchingSquares(values, 3, 3, 10, 1.0);
    expect(segs.length).toBeGreaterThan(0);
  });

  it("is deterministic — same input produces identical segment arrays", () => {
    const values = new Float32Array(9).fill(0);
    values[4] = 2.0;
    const a = marchingSquares(values, 3, 3, 10, 1.0);
    const b = marchingSquares(values, 3, 3, 10, 1.0);
    expect(a).toEqual(b);
  });

  it("segments lie within the grid bounds", () => {
    const cols = 5;
    const rows = 5;
    const cellSize = 10;
    const values = new Float32Array(cols * rows).fill(0);
    // Place hot values in top-left quadrant.
    values[0] = 2;
    values[1] = 2;
    values[cols] = 2;
    values[cols + 1] = 2;

    const segs = marchingSquares(values, cols, rows, cellSize, 1.0);
    const maxX = (cols - 1) * cellSize;
    const maxY = (rows - 1) * cellSize;

    for (const s of segs) {
      expect(s.x0).toBeGreaterThanOrEqual(0);
      expect(s.y0).toBeGreaterThanOrEqual(0);
      expect(s.x1).toBeGreaterThanOrEqual(0);
      expect(s.y1).toBeGreaterThanOrEqual(0);
      expect(s.x0).toBeLessThanOrEqual(maxX);
      expect(s.y0).toBeLessThanOrEqual(maxY);
      expect(s.x1).toBeLessThanOrEqual(maxX);
      expect(s.y1).toBeLessThanOrEqual(maxY);
    }
  });

  it("produces segments proportional to cellSize", () => {
    // Same logical field with two different cellSizes should give the same
    // number of segments but scaled coordinates.
    const values = new Float32Array(9).fill(0);
    values[4] = 2.0;

    const segsSmall = marchingSquares(values, 3, 3, 10, 1.0);
    const segsLarge = marchingSquares(values, 3, 3, 20, 1.0);

    // Same topology => same count.
    expect(segsSmall.length).toBe(segsLarge.length);

    // Large-cell coords should be exactly 2× the small-cell coords.
    for (let i = 0; i < segsSmall.length; i++) {
      const small = segsSmall[i];
      const large = segsLarge[i];
      if (small === undefined || large === undefined) continue;
      expect(large.x0).toBeCloseTo(small.x0 * 2, 8);
      expect(large.y0).toBeCloseTo(small.y0 * 2, 8);
      expect(large.x1).toBeCloseTo(small.x1 * 2, 8);
      expect(large.y1).toBeCloseTo(small.y1 * 2, 8);
    }
  });
});
