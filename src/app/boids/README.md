# Boids

## What it is

A real-time flocking simulation built with Canvas 2D and React. Each boid (triangle) steers itself using three local rules every animation frame. No central controller exists. The flock behaviour emerges from the rules alone.

## Why this concept matters

Craig Reynolds published the boids algorithm in 1987. It was a breakthrough demonstration that complex, life-like group behaviour can arise from simple local rules applied independently to each agent. The same idea underlies swarm robotics, crowd simulation in film (The Lion King wildebeest stampede), NPC flocking in games, and computational models of real animal groups.

For creative coders, boids is an ideal second project after a static generative piece. It introduces the simulation loop pattern: maintain state, step state, draw state, repeat. It also shows how emergent complexity is more interesting than programmed complexity.

## Annotated key code

**Three-rule steering loop (`boids.ts`)**

```ts
// Separation: boids too close push this one away.
// Weight by 1/dist so proximity increases force.
if (d2 < sep2 && d2 > 0) {
  const dist = Math.sqrt(d2);
  sepX -= dx / dist;
  sepY -= dy / dist;
}

// Alignment: nudge velocity toward neighbours' average velocity.
newVx += (alignVx * invN - b.vx) * alignmentWeight * 0.05;
newVy += (alignVy * invN - b.vy) * alignmentWeight * 0.05;

// Cohesion: nudge toward neighbours' average position.
newVx += cohX * invN * cohesionWeight * 0.001;
newVy += cohY * invN * cohesionWeight * 0.001;
```

The small scalar multipliers (0.05, 0.001) prevent oscillation. Raising `alignmentWeight` makes the flock move in tight formation. Raising `separationWeight` spreads it out.

**Toroidal edge wrapping (`boids.ts`)**

```ts
// Shortest-path delta in toroidal space so boids near opposite edges
// still see each other as neighbours.
if (dx > width / 2) dx -= width;
else if (dx < -width / 2) dx += width;

// Position wraps at canvas boundary.
const newX = wrap(b.x + clamped.vx, 0, width);
```

**Oriented triangle drawing (`play/page.tsx`)**

```ts
const angle = Math.atan2(b.vy, b.vx);
const cos = Math.cos(angle);
const sin = Math.sin(angle);
const tipX = b.x + cos * BOID_HALF_LEN; // forward vertex
// Wing vertices rotated 180 degrees + perpendicular offset.
const leftX = b.x + (-cos * BOID_HALF_LEN + sin * BOID_HALF_WIDTH);
```

**Theme-aware coloring (`play/page.tsx`)**

Hue maps to heading direction (angle / TAU \* 360), lightness shifts with speed. Dark theme uses high lightness (0.55-0.75) for vivid boids on a black background. Light theme uses low lightness (0.25-0.45) so boids read clearly on white and meet AA contrast.

## Attribution

Algorithm: Craig Reynolds, "Flocks, Herds, and Schools: A Distributed Behavioral Model", SIGGRAPH 1987.
Reference: [Wikipedia: Boids](https://en.wikipedia.org/wiki/Boids) and [Reynolds' original page](https://www.red3d.com/cwr/boids/).
This implementation is original code, MIT licensed.
