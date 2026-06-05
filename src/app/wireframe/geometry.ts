import { TAU } from "@/lib/creative/math";

export type Vec3 = { x: number; y: number; z: number };
export type Edge = readonly [number, number];
export type Mesh = { vertices: Vec3[]; edges: Edge[] };
export type ShapeName = "cube" | "octahedron" | "icosahedron" | "torus";

export const SHAPES: ShapeName[] = ["icosahedron", "cube", "octahedron", "torus"];

/** Scales every vertex so the most distant one sits on the unit sphere. */
function normalize(vertices: Vec3[]): Vec3[] {
  let max = 0;
  for (const v of vertices) {
    const r = Math.hypot(v.x, v.y, v.z);
    if (r > max) max = r;
  }
  if (max === 0) return vertices;
  return vertices.map((v) => ({ x: v.x / max, y: v.y / max, z: v.z / max }));
}

/**
 * Connects every pair of vertices separated by (approximately) the smallest
 * pairwise distance. For a regular solid that distance is its edge length, so
 * this recovers the true edge set without hand-listing it.
 */
export function edgesByNearest(vertices: Vec3[], relTol = 0.02): Edge[] {
  let min = Infinity;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    if (!a) continue;
    for (let j = i + 1; j < vertices.length; j++) {
      const b = vertices[j];
      if (!b) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (d < min) min = d;
    }
  }
  const edges: Edge[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    if (!a) continue;
    for (let j = i + 1; j < vertices.length; j++) {
      const b = vertices[j];
      if (!b) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (Math.abs(d - min) <= min * relTol) edges.push([i, j]);
    }
  }
  return edges;
}

function cubeVerts(): Vec3[] {
  const v: Vec3[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push({ x, y, z });
  return v;
}

function octahedronVerts(): Vec3[] {
  return [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
  ];
}

function icosahedronVerts(): Vec3[] {
  const p = (1 + Math.sqrt(5)) / 2;
  const v: Vec3[] = [];
  for (const a of [-1, 1])
    for (const b of [-p, p]) {
      v.push({ x: 0, y: a, z: b });
      v.push({ x: a, y: b, z: 0 });
      v.push({ x: b, y: 0, z: a });
    }
  return v;
}

/** A torus as a ring x section grid, with edges along both directions. */
function torus(rings = 18, sides = 11, bigR = 1, smallR = 0.42): Mesh {
  const vertices: Vec3[] = [];
  for (let i = 0; i < rings; i++) {
    const u = (i / rings) * TAU;
    for (let j = 0; j < sides; j++) {
      const w = (j / sides) * TAU;
      const cu = Math.cos(u);
      const su = Math.sin(u);
      vertices.push({
        x: (bigR + smallR * Math.cos(w)) * cu,
        y: (bigR + smallR * Math.cos(w)) * su,
        z: smallR * Math.sin(w),
      });
    }
  }
  const edges: Edge[] = [];
  const idx = (i: number, j: number) => (i % rings) * sides + (j % sides);
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < sides; j++) {
      edges.push([idx(i, j), idx(i + 1, j)]);
      edges.push([idx(i, j), idx(i, j + 1)]);
    }
  }
  return { vertices: normalize(vertices), edges };
}

export function makeMesh(shape: ShapeName): Mesh {
  if (shape === "torus") return torus();
  const raw =
    shape === "cube"
      ? cubeVerts()
      : shape === "octahedron"
        ? octahedronVerts()
        : icosahedronVerts();
  const vertices = normalize(raw);
  return { vertices, edges: edgesByNearest(vertices) };
}

/** Rotates a point around the X, then Y, then Z axes (radians). */
export function rotate(v: Vec3, ax: number, ay: number, az: number): Vec3 {
  let { x, y, z } = v;

  const cx = Math.cos(ax);
  const sx = Math.sin(ax);
  const y1 = y * cx - z * sx;
  const z1 = y * sx + z * cx;
  y = y1;
  z = z1;

  const cy = Math.cos(ay);
  const sy = Math.sin(ay);
  const x1 = x * cy + z * sy;
  const z2 = -x * sy + z * cy;
  x = x1;
  z = z2;

  const cz = Math.cos(az);
  const sz = Math.sin(az);
  const x2 = x * cz - y * sz;
  const y2 = x * sz + y * cz;
  x = x2;
  y = y2;

  return { x, y, z };
}

export type Projected = { x: number; y: number; depth: number; scale: number };

/**
 * Perspective projection. The camera sits at +cameraDist on the Z axis looking
 * at the origin; points with larger z are nearer and get a larger scale factor,
 * which is what makes the flat drawing read as 3D.
 */
export function project(v: Vec3, cameraDist: number): Projected {
  const denom = cameraDist - v.z;
  const f = cameraDist / (denom < 0.001 ? 0.001 : denom);
  return { x: v.x * f, y: v.y * f, depth: v.z, scale: f };
}
