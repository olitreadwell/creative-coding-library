import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/creative/random";
import { subdivide, type Rect } from "./subdivide";

const ROOT: Rect = { x: 0, y: 0, w: 800, h: 600 };
const TOLERANCE = 0.001;

describe("subdivide", () => {
  it("returns the single rect at depth 0", () => {
    const rng = makeRng(42);
    const leaves = subdivide(ROOT, 0, rng);
    expect(leaves).toHaveLength(1);
    expect(leaves[0]).toEqual(ROOT);
  });

  it("leaf areas sum to the parent area", () => {
    for (const depth of [1, 2, 3, 4, 5]) {
      const rng = makeRng(depth * 99);
      const leaves = subdivide(ROOT, depth, rng);
      const total = leaves.reduce((sum, r) => sum + r.w * r.h, 0);
      expect(Math.abs(total - ROOT.w * ROOT.h)).toBeLessThan(TOLERANCE);
    }
  });

  it("is deterministic given the same seed", () => {
    const leaves1 = subdivide(ROOT, 4, makeRng(7));
    const leaves2 = subdivide(ROOT, 4, makeRng(7));
    expect(leaves1).toEqual(leaves2);
  });

  it("produces different results for different seeds", () => {
    const leaves1 = subdivide(ROOT, 3, makeRng(1));
    const leaves2 = subdivide(ROOT, 3, makeRng(2));
    expect(leaves1).not.toEqual(leaves2);
  });
});
