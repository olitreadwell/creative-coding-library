import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { makeParticles, stepParticle, ageImpulses } from "./field";
import type { Particle, Impulse } from "./field";

describe("makeParticles", () => {
  it("returns the requested count", () => {
    const particles = makeParticles({ count: 50, width: 800, height: 600 });
    expect(particles).toHaveLength(50);
  });

  it("places particles within canvas bounds", () => {
    const W = 800;
    const H = 600;
    const particles = makeParticles({ count: 200, width: W, height: H });
    for (const p of particles) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(W);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(H);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = makeParticles({ count: 20, width: 400, height: 300, seed: "test" });
    const b = makeParticles({ count: 20, width: 400, height: 300, seed: "test" });
    expect(a).toEqual(b);
  });

  it("differs for different seeds", () => {
    const a = makeParticles({ count: 5, width: 400, height: 300, seed: "aaa" });
    const b = makeParticles({ count: 5, width: 400, height: 300, seed: "bbb" });
    expect(a).not.toEqual(b);
  });

  it("assigns a hue in [0, 360)", () => {
    const particles = makeParticles({ count: 100, width: 400, height: 300 });
    for (const p of particles) {
      expect(p.hue).toBeGreaterThanOrEqual(0);
      expect(p.hue).toBeLessThan(360);
    }
  });
});

describe("stepParticle", () => {
  function makeParticle(overrides?: Partial<Particle>): Particle {
    return {
      x: 200,
      y: 200,
      vx: 0,
      vy: 0,
      hue: 180,
      radius: 2,
      ...overrides,
    };
  }

  it("stays within canvas bounds after stepping", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 800, noNaN: true }),
        fc.float({ min: 0, max: 600, noNaN: true }),
        fc.float({ min: -500, max: 500, noNaN: true }),
        fc.float({ min: -500, max: 500, noNaN: true }),
        (x, y, vx, vy) => {
          const p = makeParticle({ x, y, vx, vy });
          stepParticle(p, null, [], "attract", 1, 0.016, 800, 600);
          return p.x >= 0 && p.x <= 800 && p.y >= 0 && p.y <= 600;
        },
      ),
    );
  });

  it("particle attracts toward pointer", () => {
    const p = makeParticle({ x: 0, y: 0, vx: 0, vy: 0 });
    const pointer = { x: 400, y: 400 };
    stepParticle(p, pointer, [], "attract", 5, 0.1, 800, 600);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vy).toBeGreaterThan(0);
  });

  it("particle repels from pointer", () => {
    const p = makeParticle({ x: 400, y: 400, vx: 0, vy: 0 });
    const pointer = { x: 400, y: 400 };
    stepParticle(p, pointer, [], "repel", 5, 0.1, 800, 600);
    expect(p.vx).toBeLessThanOrEqual(0);
    expect(p.vy).toBeLessThanOrEqual(0);
  });

  it("impulse pushes particle away", () => {
    const p = makeParticle({ x: 250, y: 250, vx: 0, vy: 0 });
    const impulse: Impulse = { x: 200, y: 200, strength: 10, age: 0 };
    stepParticle(p, null, [impulse], "attract", 1, 0.1, 800, 600);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vy).toBeGreaterThan(0);
  });

  it("does not crash with no pointer and no impulses", () => {
    const p = makeParticle();
    expect(() => stepParticle(p, null, [], "attract", 1, 0.016, 800, 600)).not.toThrow();
  });
});

describe("ageImpulses", () => {
  it("removes impulses older than 0.6 s", () => {
    const old: Impulse = { x: 0, y: 0, strength: 1, age: 0.59 };
    const young: Impulse = { x: 0, y: 0, strength: 1, age: 0 };
    const result = ageImpulses([old, young], 0.1);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeDefined();
  });

  it("increments age by dt", () => {
    const imp: Impulse = { x: 0, y: 0, strength: 1, age: 0.1 };
    const result = ageImpulses([imp], 0.05);
    expect(result[0]?.age).toBeCloseTo(0.15);
  });

  it("returns empty when all impulses expire", () => {
    const old: Impulse = { x: 0, y: 0, strength: 1, age: 0.9 };
    expect(ageImpulses([old], 0.1)).toHaveLength(0);
  });
});
