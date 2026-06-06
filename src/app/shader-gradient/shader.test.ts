import { describe, it, expect } from "vitest";
import { paletteSpeed, mix3, fragment, vertex } from "./shader";

describe("paletteSpeed", () => {
  it("returns 0 for calm", () => {
    expect(paletteSpeed("calm")).toBe(0);
  });

  it("returns a positive number for warm", () => {
    expect(paletteSpeed("warm")).toBeGreaterThan(0);
  });

  it("returns the largest seed for wild", () => {
    expect(paletteSpeed("wild")).toBeGreaterThan(paletteSpeed("warm"));
  });

  it("is deterministic — same input always yields the same output", () => {
    expect(paletteSpeed("warm")).toBe(paletteSpeed("warm"));
  });

  it("all seeds are finite numbers in [0, 10)", () => {
    for (const label of ["calm", "warm", "wild"] as const) {
      const s = paletteSpeed(label);
      expect(Number.isFinite(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(10);
    }
  });
});

describe("mix3", () => {
  const black: [number, number, number] = [0, 0, 0];
  const grey: [number, number, number] = [0.5, 0.5, 0.5];
  const white: [number, number, number] = [1, 1, 1];

  it("returns a at t=0", () => {
    const result = mix3(black, grey, white, 0);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(0);
  });

  it("returns c at t=1", () => {
    const result = mix3(black, grey, white, 1);
    expect(result[0]).toBeCloseTo(1);
    expect(result[1]).toBeCloseTo(1);
    expect(result[2]).toBeCloseTo(1);
  });

  it("returns b at t=0.5", () => {
    const result = mix3(black, grey, white, 0.5);
    expect(result[0]).toBeCloseTo(0.5);
    expect(result[1]).toBeCloseTo(0.5);
    expect(result[2]).toBeCloseTo(0.5);
  });

  it("returns a 3-element tuple", () => {
    const result = mix3(black, grey, white, 0.25);
    expect(result).toHaveLength(3);
  });

  it("all channels are finite numbers", () => {
    const result = mix3([0.2, 0.4, 0.6], [0.3, 0.5, 0.7], [0.8, 0.1, 0.9], 0.33);
    for (const ch of result) {
      expect(Number.isFinite(ch)).toBe(true);
    }
  });

  it("is deterministic for the same inputs", () => {
    const a = mix3(black, grey, white, 0.7);
    const b = mix3(black, grey, white, 0.7);
    expect(a).toEqual(b);
  });
});

describe("shader source strings", () => {
  it("fragment contains void main", () => {
    expect(fragment).toContain("void main");
  });

  it("fragment contains gl_FragColor assignment", () => {
    expect(fragment).toContain("gl_FragColor");
  });

  it("fragment contains uTime uniform", () => {
    expect(fragment).toContain("uTime");
  });

  it("fragment contains uResolution uniform", () => {
    expect(fragment).toContain("uResolution");
  });

  it("vertex contains gl_Position assignment", () => {
    expect(vertex).toContain("gl_Position");
  });
});
