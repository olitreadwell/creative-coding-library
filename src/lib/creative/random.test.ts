import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { mulberry32, hashString, makeRng, randRange, randInt, pick } from "./random";

describe("mulberry32", () => {
  it("is deterministic for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });
  it("produces values in [0, 1) for arbitrary seeds", () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const rng = mulberry32(seed);
        for (let i = 0; i < 50; i++) {
          const v = rng();
          if (v < 0 || v >= 1) return false;
        }
        return true;
      }),
    );
  });
});

describe("hashString", () => {
  it("is stable across calls", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
  });
  it("differs for different inputs", () => {
    expect(hashString("a")).not.toBe(hashString("b"));
  });
});

describe("makeRng", () => {
  it("accepts a string seed", () => {
    const rng = makeRng("seed");
    expect(typeof rng()).toBe("number");
  });
});

describe("randRange / randInt", () => {
  it("randRange stays within bounds", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = randRange(rng, 10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThan(20);
    }
  });
  it("randInt returns integers within bounds", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = randInt(rng, 0, 5);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(5);
    }
  });
});

describe("pick", () => {
  it("returns an element from the array", () => {
    const rng = mulberry32(1);
    const arr = ["a", "b", "c"] as const;
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(pick(rng, arr));
    }
  });
  it("throws on empty array", () => {
    const rng = mulberry32(1);
    expect(() => pick(rng, [])).toThrow();
  });
});
