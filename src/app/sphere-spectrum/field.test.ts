import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { logBandEdges, bandLevel, shelfGain, vertexBand, NUM_BANDS } from "./field";

describe("logBandEdges", () => {
  it("returns numBands+1 edges starting at 1 and ending at usableBins", () => {
    const edges = logBandEdges(NUM_BANDS, 410);
    expect(edges).toHaveLength(NUM_BANDS + 1);
    expect(edges[0]).toBe(1);
    expect(edges[edges.length - 1]).toBe(410);
  });

  it("is non-decreasing", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 64 }), fc.integer({ min: 8, max: 1024 }), (n, bins) => {
        const edges = logBandEdges(n, bins);
        for (let i = 1; i < edges.length; i++) {
          if ((edges[i] ?? 0) < (edges[i - 1] ?? 0)) return false;
        }
        return true;
      }),
    );
  });
});

describe("bandLevel", () => {
  it("returns 1 when every bin in the range is full", () => {
    const data = new Uint8Array(16).fill(255);
    expect(bandLevel(data, 0, 16)).toBe(1);
  });

  it("returns 0 for a silent range", () => {
    const data = new Uint8Array(16);
    expect(bandLevel(data, 0, 16)).toBe(0);
  });

  it("averages partial energy and clamps out-of-range indices", () => {
    const data = new Uint8Array([255, 255, 0, 0]);
    expect(bandLevel(data, 0, 4)).toBeCloseTo(0.5, 5);
    expect(bandLevel(data, -5, 99)).toBeCloseTo(0.5, 5);
  });
});

describe("shelfGain", () => {
  it("is 1 at the lowest band and 1+max at the highest", () => {
    expect(shelfGain(0, 24, 1.6)).toBe(1);
    expect(shelfGain(23, 24, 1.6)).toBeCloseTo(2.6, 5);
  });

  it("stays within [1, 1+max] for any band index", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (i) => {
        const g = shelfGain(i, 24, 1.6);
        return g >= 1 && g <= 2.6 + 1e-9;
      }),
    );
  });
});

describe("vertexBand", () => {
  it("maps the north pole to band 0 and the south pole to the last band", () => {
    expect(vertexBand(1, 1, 24)).toBe(0);
    expect(vertexBand(-1, 1, 24)).toBe(23);
  });

  it("maps the equator to a middle band", () => {
    const b = vertexBand(0, 1, 24);
    expect(b).toBeGreaterThanOrEqual(11);
    expect(b).toBeLessThanOrEqual(12);
  });

  it("clamps to a valid band for any input", () => {
    fc.assert(
      fc.property(fc.double({ min: -3, max: 3, noNaN: true }), (y) => {
        const b = vertexBand(y, 1, 24);
        return Number.isInteger(b) && b >= 0 && b <= 23;
      }),
    );
  });
});
