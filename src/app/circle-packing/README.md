## What it is

A greedy random circle packing. The canvas is filled by trying hundreds of random points; at each point a circle grows to the largest radius that touches no wall and no existing circle, and is kept only if it clears a minimum size. Earlier circles claim the open space and grow large, later ones fill the gaps and stay small. The packing is driven by the lab's seeded PRNG, so each seed reproduces the same arrangement exactly.

## Why this concept matters

This is the smallest honest example of constraint-driven generative design. Every circle obeys one rule, do not cross anything, and the size distribution (a few large discs, many small) emerges on its own rather than being chosen. The same grow-until-touching rule explains foam bubbles, packed seeds, and cracked mud, and the same packing idea powers treemaps and tag-cloud layouts. It also shows why a seeded random generator matters: reproducibility turns a one-off image into something you can shuffle, share, and test.

## Annotated key code

```ts
// pack.ts

// Largest radius at (x, y) that hits nothing: start at the nearest wall,
// then shrink to meet the closest existing circle's edge.
export function maxRadiusAt(x, y, width, height, circles, maxRadius): number {
  let r = Math.min(x, y, width - x, height - y);
  for (const c of circles) {
    const gap = Math.hypot(x - c.x, y - c.y) - c.r;
    if (gap < r) r = gap;
  }
  return Math.min(r, maxRadius);
}

// Try random points; grow each, keep it if it cleared minRadius.
// Same seed -> same packing, which the tests rely on.
for (let i = 0; i < attempts; i++) {
  const x = randRange(rng, 0, width);
  const y = randRange(rng, 0, height);
  const r = maxRadiusAt(x, y, width, height, circles, maxRadius) - padding;
  if (r >= minRadius) circles.push({ x, y, r });
}
```

The no-overlap invariant (centers at least `r1 + r2` apart) is verified with a `fast-check` property test over many seeds.

## Attribution

- Greedy random packing is creative-coding folklore; this is an original implementation.
- Background on the broader problem: https://en.wikipedia.org/wiki/Circle_packing
- Uses the lab's `makeRng` seeded PRNG and colorblind-safe `cbRamp` palette.
