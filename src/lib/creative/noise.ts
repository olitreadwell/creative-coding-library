import { makeRng } from "./random";

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Value noise on a unit-grid lattice with smoothstep interpolation.
// Output range approximately [0, 1].
export type ValueNoise2D = (x: number, y: number) => number;

export function makeValueNoise2D(seed: number | string = 0): ValueNoise2D {
  const rng = makeRng(seed);
  const grid = new Map<string, number>();
  const sample = (ix: number, iy: number): number => {
    const key = `${ix},${iy}`;
    const cached = grid.get(key);
    if (cached !== undefined) return cached;
    const v = rng();
    grid.set(key, v);
    return v;
  };
  return (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const fx = fade(x - x0);
    const fy = fade(y - y0);
    const v00 = sample(x0, y0);
    const v10 = sample(x1, y0);
    const v01 = sample(x0, y1);
    const v11 = sample(x1, y1);
    return lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy);
  };
}

// Classic Perlin gradient noise (2D). Output range approximately [-1, 1].
// Permutation table seeded via the supplied PRNG (default seed = 0).
export type PerlinNoise2D = (x: number, y: number) => number;

export function makePerlinNoise2D(seed: number | string = 0): PerlinNoise2D {
  const rng = makeRng(seed);
  const p = new Uint8Array(512);
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = base[i]!;
    base[i] = base[j]!;
    base[j] = t;
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255]!;

  const grad = (hash: number, x: number, y: number): number => {
    switch (hash & 3) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      default:
        return -x - y;
    }
  };

  return (x: number, y: number) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = p[p[xi]! + yi]!;
    const ab = p[p[xi]! + yi + 1]!;
    const ba = p[p[xi + 1]! + yi]!;
    const bb = p[p[xi + 1]! + yi + 1]!;
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  };
}
