import { describe, it, expect } from "vitest";
import { expand, turtleSegments } from "./lsystem";

const PLANT_RULES: Record<string, string> = {
  X: "F+[[X]-X]-F[-FX]+X",
  F: "FF",
};

describe("expand", () => {
  it("returns the axiom unchanged at 0 iterations", () => {
    expect(expand("X", PLANT_RULES, 0)).toBe("X");
    expect(expand("F", PLANT_RULES, 0)).toBe("F");
    expect(expand("F+F", PLANT_RULES, 0)).toBe("F+F");
  });

  it("applies one iteration correctly", () => {
    // X -> F+[[X]-X]-F[-FX]+X
    expect(expand("X", PLANT_RULES, 1)).toBe("F+[[X]-X]-F[-FX]+X");
    // F -> FF
    expect(expand("F", PLANT_RULES, 1)).toBe("FF");
  });

  it("applies two iterations correctly", () => {
    // X -> F+[[X]-X]-F[-FX]+X
    // in second pass: each F -> FF, each X -> F+[[X]-X]-F[-FX]+X
    const iter1 = expand("X", PLANT_RULES, 1);
    const iter2_manual = expand(iter1, PLANT_RULES, 1);
    expect(expand("X", PLANT_RULES, 2)).toBe(iter2_manual);
  });

  it("is deterministic: same inputs produce identical output", () => {
    const a = expand("X", PLANT_RULES, 4);
    const b = expand("X", PLANT_RULES, 4);
    expect(a).toBe(b);
  });

  it("grows strictly longer with each iteration", () => {
    const lengths = [1, 2, 3, 4].map((n) => expand("X", PLANT_RULES, n).length);
    for (let i = 1; i < lengths.length; i++) {
      const prev = lengths[i - 1] ?? 0;
      const curr = lengths[i] ?? 0;
      expect(curr).toBeGreaterThan(prev);
    }
  });

  it("passes through symbols with no rule unchanged", () => {
    const rules: Record<string, string> = { A: "AB" };
    expect(expand("AB", rules, 1)).toBe("ABB");
    // B has no rule, stays as B
    expect(expand("B", rules, 3)).toBe("B");
  });

  it("handles an empty axiom", () => {
    expect(expand("", PLANT_RULES, 5)).toBe("");
  });

  it("clamps negative iterations to 0", () => {
    expect(expand("X", PLANT_RULES, -2)).toBe("X");
  });
});

describe("turtleSegments", () => {
  const BASE_CONFIG = {
    startX: 0,
    startY: 0,
    startAngle: 0,
    stepLen: 10,
    turnDeg: 25,
    rng: null,
    jitterDeg: 0,
  };

  it("produces no segments for a string with no F", () => {
    const segs = turtleSegments("+-[]", BASE_CONFIG);
    expect(segs).toHaveLength(0);
  });

  it("produces one segment for a single F", () => {
    const segs = turtleSegments("F", BASE_CONFIG);
    expect(segs).toHaveLength(1);
    const seg = segs[0];
    expect(seg).toBeDefined();
    if (seg) {
      expect(seg.x1).toBeCloseTo(0);
      expect(seg.y1).toBeCloseTo(0);
      expect(seg.x2).toBeCloseTo(10);
      expect(seg.y2).toBeCloseTo(0);
    }
  });

  it("increments depth inside brackets", () => {
    const segs = turtleSegments("F[F]F", BASE_CONFIG);
    // Outer F, inner F, closing ] restores depth, outer F
    const depths = segs.map((s) => s.depth);
    expect(depths[0]).toBe(0);
    expect(depths[1]).toBe(1);
    expect(depths[2]).toBe(0);
  });

  it("restores position after a bracket", () => {
    // F moves right 10px, [F] branches then restores, final F continues from original pos
    const segs = turtleSegments("F[+F]F", BASE_CONFIG);
    expect(segs).toHaveLength(3);
    const last = segs[2];
    const first = segs[0];
    if (last && first) {
      // After the bracket, turtle continues from where F ended
      expect(last.x1).toBeCloseTo(first.x2);
    }
  });

  it("is deterministic with null rng", () => {
    const commands = expand("X", PLANT_RULES, 3);
    const a = turtleSegments(commands, BASE_CONFIG);
    const b = turtleSegments(commands, BASE_CONFIG);
    expect(a).toEqual(b);
  });
});
