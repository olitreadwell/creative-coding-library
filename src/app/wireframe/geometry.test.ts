import { describe, it, expect } from "vitest";
import { makeMesh, rotate, project, edgesByNearest, type Vec3 } from "./geometry";

function len(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

describe("wireframe geometry", () => {
  it("builds the expected vertex/edge counts for each solid", () => {
    const cube = makeMesh("cube");
    expect(cube.vertices).toHaveLength(8);
    expect(cube.edges).toHaveLength(12);

    const octa = makeMesh("octahedron");
    expect(octa.vertices).toHaveLength(6);
    expect(octa.edges).toHaveLength(12);

    const ico = makeMesh("icosahedron");
    expect(ico.vertices).toHaveLength(12);
    expect(ico.edges).toHaveLength(30);
  });

  it("normalizes vertices onto the unit sphere", () => {
    for (const shape of ["cube", "octahedron", "icosahedron", "torus"] as const) {
      const { vertices } = makeMesh(shape);
      const maxR = Math.max(...vertices.map(len));
      expect(maxR).toBeCloseTo(1, 5);
    }
  });

  it("rotation preserves length", () => {
    const v: Vec3 = { x: 0.3, y: -0.6, z: 0.74 };
    const r = rotate(v, 0.7, 1.2, -0.4);
    expect(len(r)).toBeCloseTo(len(v), 10);
  });

  it("projects a point on the camera axis with unit scale", () => {
    const p = project({ x: 0.5, y: -0.2, z: 0 }, 3);
    expect(p.scale).toBeCloseTo(1, 10);
    expect(p.x).toBeCloseTo(0.5, 10);
    expect(p.y).toBeCloseTo(-0.2, 10);
  });

  it("scales nearer points (larger z) up and farther points down", () => {
    const near = project({ x: 1, y: 0, z: 0.5 }, 3);
    const far = project({ x: 1, y: 0, z: -0.5 }, 3);
    expect(near.scale).toBeGreaterThan(far.scale);
  });

  it("edgesByNearest connects only the closest pairs", () => {
    // A unit square: 4 side edges, not the 2 diagonals.
    const square: Vec3[] = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 1, z: 0 },
    ];
    expect(edgesByNearest(square)).toHaveLength(4);
  });
});
