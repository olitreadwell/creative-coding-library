import { clamp } from "@/lib/creative/math";
import { makeRng, randRange } from "@/lib/creative/random";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
  radius: number;
};

export type Impulse = {
  x: number;
  y: number;
  strength: number;
  age: number;
};

export type FieldOptions = {
  count: number;
  width: number;
  height: number;
  seed?: number | string;
};

export function makeParticles({
  count,
  width,
  height,
  seed = "pointer-flow",
}: FieldOptions): Particle[] {
  const rng = makeRng(seed);
  return Array.from({ length: count }, () => ({
    x: randRange(rng, 0, width),
    y: randRange(rng, 0, height),
    vx: randRange(rng, -0.5, 0.5),
    vy: randRange(rng, -0.5, 0.5),
    hue: randRange(rng, 0, 360),
    radius: randRange(rng, 1.5, 4),
  }));
}

export function stepParticle(
  p: Particle,
  pointer: { x: number; y: number } | null,
  impulses: readonly Impulse[],
  mode: "attract" | "repel",
  strength: number,
  dt: number,
  width: number,
  height: number,
): void {
  // Scale the speed cap with strength so the top of the slider really flings
  // particles, while the base force is strong enough that even the low end pulls
  // visibly. This widens the felt range at both extremes.
  const maxSpeed = 160 + strength * 95;
  const friction = 0.88;

  if (pointer !== null) {
    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 1;
    const force = (strength * 115) / (dist * 0.5 + 35);
    const sign = mode === "attract" ? 1 : -1;
    p.vx += sign * (dx / dist) * force * dt;
    p.vy += sign * (dy / dist) * force * dt;
  }

  for (const imp of impulses) {
    const dx = p.x - imp.x;
    const dy = p.y - imp.y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 1;
    const radius = 200;
    if (dist < radius) {
      const falloff = 1 - dist / radius;
      const impForce = (imp.strength * falloff * 600) / (dist + 20);
      p.vx += (dx / dist) * impForce * dt;
      p.vy += (dy / dist) * impForce * dt;
    }
  }

  p.vx *= friction;
  p.vy *= friction;

  const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
  if (speed > maxSpeed) {
    p.vx = (p.vx / speed) * maxSpeed;
    p.vy = (p.vy / speed) * maxSpeed;
  }

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  p.x = clamp(p.x, 0, width);
  p.y = clamp(p.y, 0, height);

  if (p.x <= 0 || p.x >= width) p.vx *= -1;
  if (p.y <= 0 || p.y >= height) p.vy *= -1;
}

export function ageImpulses(impulses: Impulse[], dt: number): Impulse[] {
  return impulses.map((imp) => ({ ...imp, age: imp.age + dt })).filter((imp) => imp.age < 0.6);
}
