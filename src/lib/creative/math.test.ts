import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { clamp, lerp, inverseLerp, map, smoothstep, wrap, degToRad, radToDeg, TAU } from "./math";

describe("clamp", () => {
  it("returns value within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("clamps below min and above max", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
  it("never escapes [min,max] for finite inputs", () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (a, b, v) => {
          const min = Math.min(a, b);
          const max = Math.max(a, b);
          const out = clamp(v, min, max);
          return out >= min && out <= max;
        },
      ),
    );
  });
});

describe("lerp / inverseLerp", () => {
  it("lerp(a,b,0)=a and lerp(a,b,1)=b", () => {
    expect(lerp(2, 10, 0)).toBe(2);
    expect(lerp(2, 10, 1)).toBe(10);
  });
  it("inverseLerp is the inverse of lerp", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true }),
        fc.double({ min: -1e6, max: 1e6, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (a, b, t) => {
          fc.pre(Math.abs(a - b) > 1e-6);
          const v = lerp(a, b, t);
          return Math.abs(inverseLerp(a, b, v) - t) < 1e-6;
        },
      ),
    );
  });
});

describe("map", () => {
  it("maps endpoints exactly", () => {
    expect(map(0, 0, 10, 100, 200)).toBe(100);
    expect(map(10, 0, 10, 100, 200)).toBe(200);
  });
});

describe("smoothstep", () => {
  it("returns 0 at or below edge0 and 1 at or above edge1", () => {
    expect(smoothstep(0, 1, -0.5)).toBe(0);
    expect(smoothstep(0, 1, 1.5)).toBe(1);
  });
  it("returns 0.5 at the midpoint", () => {
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 6);
  });
});

describe("wrap", () => {
  it("returns the value when within range", () => {
    expect(wrap(5, 0, 10)).toBe(5);
  });
  it("wraps negatives positively", () => {
    expect(wrap(-1, 0, 10)).toBe(9);
  });
  it("wraps positives", () => {
    expect(wrap(11, 0, 10)).toBe(1);
  });
});

describe("deg/rad", () => {
  it("180deg = PI rad", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 10);
  });
});

describe("TAU", () => {
  it("equals 2*PI", () => {
    expect(TAU).toBe(Math.PI * 2);
  });
});
