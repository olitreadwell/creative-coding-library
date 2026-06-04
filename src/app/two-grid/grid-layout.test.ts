import { describe, it, expect } from "vitest";
import { gridPositions, centerDistance, pulseScale } from "./grid-layout";

describe("gridPositions", () => {
  it("returns cols * rows cells", () => {
    const cells = gridPositions(5, 4, 10, 10);
    expect(cells.length).toBe(20);
  });

  it("first cell is at (cellW/2, cellH/2)", () => {
    const cells = gridPositions(3, 3, 20, 30);
    const first = cells[0];
    expect(first).toBeDefined();
    expect(first!.x).toBeCloseTo(10);
    expect(first!.y).toBeCloseTo(15);
  });

  it("spacing between adjacent cols equals cellW", () => {
    const cells = gridPositions(4, 2, 15, 20);
    const row0 = cells.filter((c) => c.row === 0);
    for (let i = 1; i < row0.length; i++) {
      const prev = row0[i - 1];
      const curr = row0[i];
      expect(curr!.x - prev!.x).toBeCloseTo(15);
    }
  });

  it("spacing between adjacent rows equals cellH", () => {
    const cells = gridPositions(2, 4, 10, 25);
    const col0 = cells.filter((c) => c.col === 0);
    for (let i = 1; i < col0.length; i++) {
      const prev = col0[i - 1];
      const curr = col0[i];
      expect(curr!.y - prev!.y).toBeCloseTo(25);
    }
  });
});

describe("centerDistance", () => {
  it("center cell of a 3x3 grid has distance 0", () => {
    expect(centerDistance(1, 1, 3, 3)).toBeCloseTo(0);
  });

  it("is symmetric: top-left mirrors bottom-right", () => {
    const d1 = centerDistance(0, 0, 5, 5);
    const d2 = centerDistance(4, 4, 5, 5);
    expect(d1).toBeCloseTo(d2);
  });

  it("is symmetric: top-right mirrors bottom-left", () => {
    const d1 = centerDistance(0, 4, 5, 5);
    const d2 = centerDistance(4, 0, 5, 5);
    expect(d1).toBeCloseTo(d2);
  });

  it("corner cells have max distance 1", () => {
    expect(centerDistance(0, 0, 5, 5)).toBeCloseTo(1);
  });

  it("normalised value is always in [0, 1]", () => {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const d = centerDistance(row, col, 6, 6);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(1.01); // small float tolerance
      }
    }
  });
});

describe("pulseScale", () => {
  it("returns the same value for the same inputs (deterministic)", () => {
    const a = pulseScale(0.5, 1.23);
    const b = pulseScale(0.5, 1.23);
    expect(a).toBe(b);
  });

  it("stays within [minScale, maxScale]", () => {
    const min = 0.6;
    const max = 1.3;
    for (let t = 0; t < Math.PI * 4; t += 0.1) {
      const s = pulseScale(0.5, t, Math.PI * 1.5, min, max);
      expect(s).toBeGreaterThanOrEqual(min - 1e-9);
      expect(s).toBeLessThanOrEqual(max + 1e-9);
    }
  });

  it("cells at different distances produce different phases mid-swing", () => {
    const time = Math.PI / 2;
    const near = pulseScale(0, time);
    const far = pulseScale(0.25, time);
    expect(near).not.toBeCloseTo(far, 1);
  });
});
