import { describe, it, expect } from "vitest";
import { stepDeJong, DEFAULT_PARAMS } from "./attractor";

describe("de Jong attractor", () => {
  it("is deterministic for the same input", () => {
    const a = stepDeJong(0.3, -0.7, DEFAULT_PARAMS);
    const b = stepDeJong(0.3, -0.7, DEFAULT_PARAMS);
    expect(a).toEqual(b);
  });

  it("keeps every point within [-2, 2] on both axes", () => {
    let { x, y } = { x: 0, y: 0 };
    for (let i = 0; i < 5000; i++) {
      ({ x, y } = stepDeJong(x, y, DEFAULT_PARAMS));
      expect(x).toBeGreaterThanOrEqual(-2);
      expect(x).toBeLessThanOrEqual(2);
      expect(y).toBeGreaterThanOrEqual(-2);
      expect(y).toBeLessThanOrEqual(2);
    }
  });

  it("different parameters produce different points", () => {
    const base = stepDeJong(0.5, 0.5, DEFAULT_PARAMS);
    const other = stepDeJong(0.5, 0.5, { a: -2, b: -2, c: -1.2, d: 2 });
    expect(base).not.toEqual(other);
  });
});
