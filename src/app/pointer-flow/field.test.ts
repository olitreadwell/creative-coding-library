import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  makeBalloons,
  stepBalloon,
  stepShockwaves,
  makeShockwave,
  shockwaveImpulse,
} from "./field";
import type { Balloon, Shockwave } from "./field";

// ---------------------------------------------------------------------------
// makeBalloons
// ---------------------------------------------------------------------------

describe("makeBalloons", () => {
  it("returns the requested count", () => {
    expect(makeBalloons({ count: 12, width: 800, height: 600 })).toHaveLength(12);
  });

  it("places balloons within canvas bounds", () => {
    const W = 800;
    const H = 600;
    const balloons = makeBalloons({ count: 50, width: W, height: H });
    for (const b of balloons) {
      expect(b.x).toBeGreaterThan(0);
      expect(b.x).toBeLessThan(W);
      expect(b.y).toBeGreaterThan(0);
      expect(b.y).toBeLessThan(H);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = makeBalloons({ count: 10, width: 400, height: 300, seed: "test" });
    const b = makeBalloons({ count: 10, width: 400, height: 300, seed: "test" });
    expect(a).toEqual(b);
  });

  it("differs for different seeds", () => {
    const a = makeBalloons({ count: 5, width: 400, height: 300, seed: "aaa" });
    const b = makeBalloons({ count: 5, width: 400, height: 300, seed: "bbb" });
    expect(a).not.toEqual(b);
  });

  it("initialises squash at 1 (no deformation)", () => {
    const balloons = makeBalloons({ count: 8, width: 400, height: 300 });
    for (const b of balloons) {
      expect(b.squash).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// shockwaveImpulse (pure, property-testable)
// ---------------------------------------------------------------------------

describe("shockwaveImpulse", () => {
  it("returns 0 when ring has not yet reached the balloon", () => {
    // Ring at 50 px, balloon at 200 px — ring has not arrived.
    expect(shockwaveImpulse(200, 50, 5)).toBe(0);
  });

  it("returns 0 when ring is far past the balloon", () => {
    // Ring at 400 px, balloon at 100 px — ring is well past.
    expect(shockwaveImpulse(100, 400, 5)).toBe(0);
  });

  it("returns a positive value when ring is passing through the balloon", () => {
    // Ring radius equals balloon distance: delta = 0, envelope peaks at 1.
    expect(shockwaveImpulse(150, 150, 5)).toBeGreaterThan(0);
  });

  it("scales linearly with strength", () => {
    const low = shockwaveImpulse(150, 150, 2);
    const high = shockwaveImpulse(150, 150, 4);
    expect(high / low).toBeCloseTo(2, 3);
  });

  it("is deterministic for the same inputs", () => {
    expect(shockwaveImpulse(120, 120, 3)).toBe(shockwaveImpulse(120, 120, 3));
  });

  it("is non-negative for all valid inputs (property)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 800, noNaN: true }),
        fc.float({ min: 0, max: 800, noNaN: true }),
        fc.float({ min: 1, max: 10, noNaN: true }),
        (dist, ring, strength) => shockwaveImpulse(dist, ring, strength) >= 0,
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// stepBalloon
// ---------------------------------------------------------------------------

describe("stepBalloon", () => {
  function makeBalloon(overrides?: Partial<Balloon>): Balloon {
    return {
      x: 200,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 40,
      colorIdx: 0,
      wobblePhase: 0,
      wobbleSpeed: 1,
      squash: 1,
      squashV: 0,
      ...overrides,
    };
  }

  it("stays within canvas bounds after one step (property)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 800, noNaN: true }),
        fc.float({ min: 0, max: 600, noNaN: true }),
        fc.float({ min: -500, max: 500, noNaN: true }),
        fc.float({ min: -500, max: 500, noNaN: true }),
        (x, y, vx, vy) => {
          const b = makeBalloon({ x, y, vx, vy });
          stepBalloon(b, null, [], [], "attract", 1, 0.016, 800, 600);
          return b.x >= 0 && b.x <= 800 && b.y >= 0 && b.y <= 600;
        },
      ),
    );
  });

  it("attracts toward pointer", () => {
    // Centered so a boundary bounce can't flip the small attract velocity.
    const b = makeBalloon({ x: 400, y: 300, vx: 0, vy: 0 });
    stepBalloon(b, { x: 700, y: 500 }, [], [], "attract", 5, 0.1, 800, 600);
    expect(b.vx).toBeGreaterThan(0);
    expect(b.vy).toBeGreaterThan(0);
  });

  it("repels from pointer when mode is repel", () => {
    const b = makeBalloon({ x: 400, y: 300, vx: 0, vy: 0 });
    stepBalloon(b, { x: 700, y: 500 }, [], [], "repel", 5, 0.1, 800, 600);
    expect(b.vx).toBeLessThan(0);
    expect(b.vy).toBeLessThan(0);
  });

  it("shockwave pushes balloon outward and kicks squash spring", () => {
    const b = makeBalloon({ x: 300, y: 300, vx: 0, vy: 0, squash: 1, squashV: 0 });
    const dist = Math.sqrt((300 - 150) ** 2 + (300 - 150) ** 2);
    const sw: Shockwave = {
      x: 150,
      y: 150,
      radius: dist,
      speed: 300,
      strength: 8,
      age: 0,
    };
    stepBalloon(b, null, [sw], [], "attract", 1, 0.1, 800, 600);
    expect(b.vx).toBeGreaterThan(0);
    expect(b.vy).toBeGreaterThan(0);
    expect(b.squashV).toBeLessThan(0);
  });

  it("does not crash with no pointer and no shockwaves", () => {
    const b = makeBalloon();
    expect(() => stepBalloon(b, null, [], [], "attract", 1, 0.016, 800, 600)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// stepShockwaves
// ---------------------------------------------------------------------------

describe("stepShockwaves", () => {
  it("expands ring radius by speed * dt", () => {
    const sw = makeShockwave(100, 100, 5, 800);
    const [next] = stepShockwaves([sw], 0.1);
    expect(next?.radius).toBeCloseTo(sw.speed * 0.1, 2);
  });

  it("removes waves older than 1.4 s", () => {
    const old: Shockwave = { x: 0, y: 0, radius: 600, speed: 400, strength: 5, age: 1.39 };
    expect(stepShockwaves([old], 0.1)).toHaveLength(0);
  });

  it("keeps young waves alive", () => {
    const young: Shockwave = { x: 0, y: 0, radius: 0, speed: 400, strength: 5, age: 0 };
    expect(stepShockwaves([young], 0.016)).toHaveLength(1);
  });

  it("increments age by dt", () => {
    const sw = makeShockwave(0, 0, 3, 600);
    const [next] = stepShockwaves([sw], 0.05);
    expect(next?.age).toBeCloseTo(0.05, 5);
  });
});
