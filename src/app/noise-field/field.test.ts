import { describe, it, expect } from "vitest";
import { makePerlinNoise2D } from "@/lib/creative/noise";
import { makeRng } from "@/lib/creative/random";
import { flowAngle, makeParticles, stepParticle } from "./field";

const WIDTH = 800;
const HEIGHT = 600;
const SCALE = 0.003;

describe("makeParticles", () => {
  it("returns exactly `count` particles", () => {
    const rng = makeRng("test-seed");
    const particles = makeParticles(rng, 100, WIDTH, HEIGHT);
    expect(particles).toHaveLength(100);
  });

  it("places all particles within canvas bounds", () => {
    const rng = makeRng("bounds-seed");
    const particles = makeParticles(rng, 500, WIDTH, HEIGHT);
    for (const p of particles) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(WIDTH);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(HEIGHT);
    }
  });
});

describe("stepParticle", () => {
  it("keeps the particle within [0, width) and [0, height) after a normal step", () => {
    const p = { x: 400, y: 300 };
    const next = stepParticle(p, Math.PI / 4, 2, WIDTH, HEIGHT);
    expect(next.x).toBeGreaterThanOrEqual(0);
    expect(next.x).toBeLessThan(WIDTH);
    expect(next.y).toBeGreaterThanOrEqual(0);
    expect(next.y).toBeLessThan(HEIGHT);
  });

  it("wraps a particle that steps past the right edge", () => {
    const p = { x: WIDTH - 0.5, y: HEIGHT / 2 };
    const next = stepParticle(p, 0, 2, WIDTH, HEIGHT);
    expect(next.x).toBeGreaterThanOrEqual(0);
    expect(next.x).toBeLessThan(WIDTH);
  });

  it("wraps a particle that steps past the left edge", () => {
    const p = { x: 0.5, y: HEIGHT / 2 };
    const next = stepParticle(p, Math.PI, 2, WIDTH, HEIGHT);
    expect(next.x).toBeGreaterThanOrEqual(0);
    expect(next.x).toBeLessThan(WIDTH);
  });

  it("wraps a particle that steps past the bottom edge", () => {
    const p = { x: WIDTH / 2, y: HEIGHT - 0.5 };
    const next = stepParticle(p, Math.PI / 2, 2, WIDTH, HEIGHT);
    expect(next.y).toBeGreaterThanOrEqual(0);
    expect(next.y).toBeLessThan(HEIGHT);
  });

  it("wraps a particle that steps past the top edge", () => {
    const p = { x: WIDTH / 2, y: 0.5 };
    const next = stepParticle(p, -Math.PI / 2, 2, WIDTH, HEIGHT);
    expect(next.y).toBeGreaterThanOrEqual(0);
    expect(next.y).toBeLessThan(HEIGHT);
  });
});

describe("flowAngle", () => {
  it("returns the same value for the same perlin instance and inputs", () => {
    const perlin = makePerlinNoise2D("determinism-seed");
    const a1 = flowAngle(perlin, 100, 200, SCALE);
    const a2 = flowAngle(perlin, 100, 200, SCALE);
    expect(a1).toBe(a2);
  });

  it("returns a finite number", () => {
    const perlin = makePerlinNoise2D("finite-seed");
    const angle = flowAngle(perlin, 50, 75, SCALE);
    expect(Number.isFinite(angle)).toBe(true);
  });

  it("returns different values for different positions", () => {
    const perlin = makePerlinNoise2D("variation-seed");
    const a1 = flowAngle(perlin, 0, 0, SCALE);
    const a2 = flowAngle(perlin, 100, 200, SCALE);
    expect(a1).not.toBe(a2);
  });
});
