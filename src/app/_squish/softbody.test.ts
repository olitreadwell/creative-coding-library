import { describe, it, expect } from "vitest";
import {
  makePoint,
  verletStep,
  polygonArea,
  solveDistanceConstraint,
  applyPressure,
  collideWithBounds,
  type Blob,
} from "./softbody";

describe("makePoint", () => {
  it("sets x/y and px/py to the initial position", () => {
    const p = makePoint(10, 20);
    expect(p.x).toBe(10);
    expect(p.y).toBe(20);
    expect(p.px).toBe(10);
    expect(p.py).toBe(20);
  });
});

describe("verletStep", () => {
  it("applies gravity over time", () => {
    const p = makePoint(0, 0);
    const result = verletStep(p, 1 / 60, 980, 1.0);
    expect(result.y).toBeGreaterThan(0);
  });

  it("preserves velocity from previous step", () => {
    const p = { x: 10, y: 0, px: 0, py: 0 };
    const result = verletStep(p, 1 / 60, 0, 1.0);
    expect(result.x).toBeCloseTo(20, 5);
  });

  it("damping reduces velocity", () => {
    const p = { x: 10, y: 0, px: 0, py: 0 };
    const undamped = verletStep(p, 1 / 60, 0, 1.0);
    const damped = verletStep(p, 1 / 60, 0, 0.9);
    expect(Math.abs(damped.x - damped.px)).toBeLessThan(Math.abs(undamped.x - undamped.px));
  });

  it("updates px/py to previous x/y", () => {
    const p = makePoint(5, 7);
    const result = verletStep(p, 1 / 60, 0, 1.0);
    expect(result.px).toBe(5);
    expect(result.py).toBe(7);
  });
});

describe("polygonArea", () => {
  it("returns 0 for empty or single-point input", () => {
    expect(polygonArea([])).toBe(0);
    expect(polygonArea([makePoint(0, 0)])).toBe(0);
  });

  it("computes correct area for a unit square", () => {
    const square = [makePoint(0, 0), makePoint(1, 0), makePoint(1, 1), makePoint(0, 1)];
    expect(polygonArea(square)).toBeCloseTo(1, 6);
  });

  it("computes correct area for a known rectangle", () => {
    const rect = [makePoint(0, 0), makePoint(4, 0), makePoint(4, 3), makePoint(0, 3)];
    expect(polygonArea(rect)).toBeCloseTo(12, 6);
  });

  it("is positive regardless of winding order", () => {
    const cw = [makePoint(0, 0), makePoint(0, 1), makePoint(1, 1), makePoint(1, 0)];
    const ccw = [makePoint(0, 0), makePoint(1, 0), makePoint(1, 1), makePoint(0, 1)];
    expect(polygonArea(cw)).toBeGreaterThan(0);
    expect(polygonArea(ccw)).toBeGreaterThan(0);
  });
});

describe("solveDistanceConstraint", () => {
  it("moves two points toward their rest length", () => {
    const a = makePoint(0, 0);
    const b = makePoint(2, 0);
    solveDistanceConstraint(a, b, 1, 1.0);
    const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    expect(dist).toBeCloseTo(1, 5);
  });

  it("is symmetric: both points move equally", () => {
    const a = makePoint(0, 0);
    const b = makePoint(4, 0);
    const midBefore = (a.x + b.x) / 2;
    solveDistanceConstraint(a, b, 2, 1.0);
    const midAfter = (a.x + b.x) / 2;
    expect(midAfter).toBeCloseTo(midBefore, 10);
  });

  it("lower stiffness produces partial correction", () => {
    const a = makePoint(0, 0);
    const b = makePoint(2, 0);
    solveDistanceConstraint(a, b, 1, 0.5);
    const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    expect(dist).toBeGreaterThan(1);
    expect(dist).toBeLessThan(2);
  });

  it("does nothing when distance is already at rest length", () => {
    const a = makePoint(0, 0);
    const b = makePoint(1, 0);
    const ax0 = a.x;
    const bx0 = b.x;
    solveDistanceConstraint(a, b, 1, 1.0);
    expect(a.x).toBeCloseTo(ax0, 10);
    expect(b.x).toBeCloseTo(bx0, 10);
  });
});

describe("applyPressure", () => {
  it("expands a blob whose area is less than restArea", () => {
    const pts = [makePoint(0, 0), makePoint(1, 0), makePoint(1, 1), makePoint(0, 1)];
    const restLengths = [1, 1, 1, 1];
    const blob: Blob = {
      points: pts,
      restLengths,
      restArea: 2,
      color: "#fff",
    };
    const areaBefore = 1;
    applyPressure(blob, 0.001);
    const areaAfter = polygonArea(blob.points);
    expect(areaAfter).toBeGreaterThan(areaBefore);
  });

  it("does nothing when area matches restArea", () => {
    const pts = [makePoint(0, 0), makePoint(1, 0), makePoint(1, 1), makePoint(0, 1)];
    const blob: Blob = {
      points: pts.map((p) => ({ ...p })),
      restLengths: [1, 1, 1, 1],
      restArea: 1,
      color: "#fff",
    };
    const before = pts.map((p) => ({ x: p.x, y: p.y }));
    applyPressure(blob, 1.0);
    for (let i = 0; i < blob.points.length; i++) {
      expect(blob.points[i]?.x).toBeCloseTo(before[i]?.x ?? 0, 8);
      expect(blob.points[i]?.y).toBeCloseTo(before[i]?.y ?? 0, 8);
    }
  });
});

describe("collideWithBounds", () => {
  it("clamps a point below the floor", () => {
    const pts = [{ x: 50, y: 120, px: 50, py: 100 }];
    collideWithBounds(pts, 0, 200, 100, 0.5);
    expect(pts[0]?.y).toBeLessThanOrEqual(100);
  });

  it("clamps a point past the left wall", () => {
    const pts = [{ x: -10, y: 50, px: 0, py: 50 }];
    collideWithBounds(pts, 0, 200, 200, 0.5);
    expect(pts[0]?.x).toBeGreaterThanOrEqual(0);
  });

  it("clamps a point past the right wall", () => {
    const pts = [{ x: 210, y: 50, px: 200, py: 50 }];
    collideWithBounds(pts, 0, 200, 200, 0.5);
    expect(pts[0]?.x).toBeLessThanOrEqual(200);
  });

  it("does not move a point that is in bounds", () => {
    const pts = [{ x: 100, y: 80, px: 95, py: 75 }];
    collideWithBounds(pts, 0, 200, 200, 0.5);
    expect(pts[0]?.x).toBe(100);
    expect(pts[0]?.y).toBe(80);
  });
});
