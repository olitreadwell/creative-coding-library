export type Rng = () => number;

// mulberry32: small, fast, seedable 32-bit PRNG. Deterministic given the same seed.
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRng(seed: number | string): Rng {
  return mulberry32(typeof seed === "number" ? seed : hashString(seed));
}

export function randRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function randInt(rng: Rng, minInclusive: number, maxExclusive: number): number {
  return Math.floor(randRange(rng, minInclusive, maxExclusive));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error("pick: empty array");
  return items[randInt(rng, 0, items.length)] as T;
}
