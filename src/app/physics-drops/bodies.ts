import type { Rng } from "@/lib/creative/random";
import { randRange, randInt } from "@/lib/creative/random";

export type BodyKind = "circle" | "poly";

export type BodySpec = {
  x: number;
  kind: BodyKind;
  size: number;
  sides: number;
  hue: number;
};

// Size here is a diameter in px; buildBody halves it to get a radius.
// These values produce radii of 20–40 px at sizeScale=1.0 — visibly chunky.
const MIN_SIZE = 40;
const MAX_SIZE = 80;
const MIN_SIDES = 3;
const MAX_SIDES = 7;

/**
 * Generate an array of random body specs using a seeded PRNG.
 * Pure and deterministic: no DOM, no Matter.js.
 *
 * @param rng   Seeded random number generator
 * @param count Number of body specs to produce
 * @param width Canvas width in CSS pixels; x values are clamped within this
 * @returns     Array of `count` BodySpec objects
 */
export function makeSpecs(rng: Rng, count: number, width: number): BodySpec[] {
  const specs: BodySpec[] = [];
  for (let i = 0; i < count; i++) {
    const kind: BodyKind = rng() < 0.5 ? "circle" : "poly";
    const size = randRange(rng, MIN_SIZE, MAX_SIZE);
    const sides = kind === "poly" ? randInt(rng, MIN_SIDES, MAX_SIDES + 1) : 0;
    const margin = size;
    const x = randRange(rng, margin, Math.max(margin + 1, width - margin));
    const hue = randRange(rng, 0, 360);
    specs.push({ x, kind, size, sides, hue });
  }
  return specs;
}
