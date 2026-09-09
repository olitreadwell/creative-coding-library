import { describe, it, expect } from "vitest";
import { makeBoids, stepBoids, DEFAULT_OPTS } from "./boids";
import { makeRng } from "@/lib/creative/random";
import type { BoidsOpts } from "./boids";

const W = 800;
const H = 600;
const COUNT = 50;

describe("makeBoids", () => {
  it("creates exactly the requested number of boids", () => {
    const rng = makeRng(42);
    const boids = makeBoids(rng, COUNT, W, H);
    expect(boids).toHaveLength(COUNT);
  });

  it("places all boids within canvas bounds", () => {
    const rng = makeRng(99);
    const boids = makeBoids(rng, COUNT, W, H);
    for (const b of boids) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThan(W);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThan(H);
    }
  });

  it("gives every boid a non-zero velocity", () => {
    const rng = makeRng(7);
    const boids = makeBoids(rng, COUNT, W, H);
    for (const b of boids) {
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      expect(speed).toBeGreaterThan(0);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = makeBoids(makeRng(1234), COUNT, W, H);
    const b = makeBoids(makeRng(1234), COUNT, W, H);
    for (let i = 0; i < COUNT; i++) {
      expect(a[i]).toEqual(b[i]);
    }
  });

  it("produces different results for different seeds", () => {
    const a = makeBoids(makeRng(1), COUNT, W, H);
    const b = makeBoids(makeRng(2), COUNT, W, H);
    // At least one boid should differ.
    const anyDiff = a.some((ba, i) => ba.x !== b[i]?.x || ba.y !== b[i]?.y);
    expect(anyDiff).toBe(true);
  });
});

describe("stepBoids", () => {
  it("keeps all boid positions within [0, width) x [0, height)", () => {
    const rng = makeRng(42);
    let boids = makeBoids(rng, COUNT, W, H);

    // Run 30 steps — enough to hit an edge wrap.
    for (let i = 0; i < 30; i++) {
      boids = stepBoids(boids, DEFAULT_OPTS, W, H);
    }

    for (const b of boids) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThan(W);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThan(H);
    }
  });

  it("keeps all boid speeds within [minSpeed, maxSpeed]", () => {
    const rng = makeRng(77);
    let boids = makeBoids(rng, COUNT, W, H);

    for (let i = 0; i < 30; i++) {
      boids = stepBoids(boids, DEFAULT_OPTS, W, H);
    }

    for (const b of boids) {
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      expect(speed).toBeGreaterThanOrEqual(DEFAULT_OPTS.minSpeed - 1e-9);
      expect(speed).toBeLessThanOrEqual(DEFAULT_OPTS.maxSpeed + 1e-9);
    }
  });

  it("is deterministic: same input produces same output", () => {
    const seed = 321;
    const rng1 = makeRng(seed);
    const rng2 = makeRng(seed);
    const boidsA = makeBoids(rng1, COUNT, W, H);
    const boidsB = makeBoids(rng2, COUNT, W, H);

    const stepA = stepBoids(boidsA, DEFAULT_OPTS, W, H);
    const stepB = stepBoids(boidsB, DEFAULT_OPTS, W, H);

    for (let i = 0; i < COUNT; i++) {
      expect(stepA[i]).toEqual(stepB[i]);
    }
  });

  it("does not mutate the input array", () => {
    const rng = makeRng(11);
    const original = makeBoids(rng, 10, W, H);
    const snapshot = original.map((b) => ({ ...b }));
    stepBoids(original, DEFAULT_OPTS, W, H);
    for (let i = 0; i < original.length; i++) {
      expect(original[i]).toEqual(snapshot[i]);
    }
  });

  it("handles zero boids without throwing", () => {
    expect(() => stepBoids([], DEFAULT_OPTS, W, H)).not.toThrow();
  });

  it("handles a single boid (no neighbours) and stays in-bounds", () => {
    const rng = makeRng(55);
    let boids = makeBoids(rng, 1, W, H);
    for (let i = 0; i < 10; i++) {
      boids = stepBoids(boids, DEFAULT_OPTS, W, H);
    }
    const b = boids[0];
    expect(b).toBeDefined();
    if (b) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThan(W);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThan(H);
    }
  });

  it("respects custom opts (higher maxSpeed allows faster boids after many steps)", () => {
    const fastOpts: BoidsOpts = {
      ...DEFAULT_OPTS,
      minSpeed: 5,
      maxSpeed: 10,
    };
    const rng = makeRng(66);
    let boids = makeBoids(rng, COUNT, W, H);
    for (let i = 0; i < 10; i++) {
      boids = stepBoids(boids, fastOpts, W, H);
    }
    for (const b of boids) {
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      expect(speed).toBeGreaterThanOrEqual(fastOpts.minSpeed - 1e-9);
      expect(speed).toBeLessThanOrEqual(fastOpts.maxSpeed + 1e-9);
    }
  });
});
