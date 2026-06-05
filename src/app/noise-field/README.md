## What it is

Two thousand particles drift across a dark canvas, steered each frame by a Perlin noise field so they curl and flow in smooth, organic rivers of light.

## Why this concept matters

Flow fields are one of the core building blocks of generative art. The key idea is simple: instead of moving objects in straight lines, you map every point in 2D space to a direction using a noise function. Noise changes gradually, so nearby points have similar directions and objects cluster into streams rather than scattering randomly. It is the same principle used in fluid simulations, smoke effects, and procedural terrain. Once you understand it, you see it everywhere.

## Annotated key code

```ts
// field.ts

// `scale` controls how zoomed-in the noise field is.
// A small value (0.003) means nearby points are very similar,
// producing long, sweeping curves. A large value gives chaotic zigzags.
export function flowAngle(perlin: PerlinNoise2D, x: number, y: number, scale: number): number {
  // Perlin returns roughly [-1, 1]. Multiplying by TAU * 2 maps that
  // to [-4π, 4π], giving particles more than one full rotation of variety.
  return perlin(x * scale, y * scale) * TAU * 2;
}

// Move the particle one step along the flow direction,
// then wrap it back into the canvas if it crosses an edge.
export function stepParticle(
  p: Particle,
  angle: number,
  speed: number,
  width: number,
  height: number,
): Particle {
  const nx = wrap(p.x + Math.cos(angle) * speed, 0, width);
  const ny = wrap(p.y + Math.sin(angle) * speed, 0, height);
  return { x: nx, y: ny };
}
```

## Attribution

- Original concept: Daniel Shiffman, "Flow Fields" chapter in _The Nature of Code_ (https://natureofcode.com/)
- Perlin noise implementation: classic gradient noise (Ken Perlin, 1983) adapted in `@/lib/creative/noise`
