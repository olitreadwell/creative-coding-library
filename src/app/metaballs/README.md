# Metaballs

## What it is

An animated metaballs renderer built on an HTML canvas. Several blobs drift around the screen, bouncing off the edges. When two blobs get close their scalar fields add up and they merge into one shape. When they drift apart they split cleanly. A Shuffle button respawns the balls with new random starting positions.

## Why this concept matters

A metaball is an implicit surface: you never define its boundary directly. Instead you define an influence function that is high near the center and low at a distance. Add several influence functions together to get a scalar field. Wherever the field crosses a threshold value, that is the surface of the blob. The merging behavior is not a special effect — it falls out of simple addition.

The 2D version of the surface-extraction algorithm used here is called marching squares. Each cell of the sampling grid is classified by which corners are above the threshold, and a short line segment traces the boundary across that cell. The same idea scales to 3D as marching cubes, the algorithm behind most real-time fluid and volumetric effects.

## Annotated key code

**Scalar field (`field.ts`)**

```ts
export function fieldAt(balls, x, y) {
  let sum = 0;
  for (const ball of balls) {
    const dx = x - ball.x;
    const dy = y - ball.y;
    const d2 = dx * dx + dy * dy;
    sum += (ball.r * ball.r) / d2;
  }
  return sum;
}
```

`r^2 / d^2` gives the influence of one ball at distance `d`. Summing across all balls gives the total field. Points inside any blob have field above the threshold; points between close blobs may also exceed it, causing them to merge.

**Marching squares (`field.ts`)**

The 4-bit case index (which of the four cell corners are above the threshold) selects a pair of edge midpoints. Linear interpolation places each midpoint precisely where the field crosses the threshold. Saddle cases (5 and 10) are resolved by comparing the average field across the two diagonal pairs.

**DPR-aware canvas (`play/page.tsx`)**

```ts
const dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(cssW * dpr);
canvas.height = Math.round(cssH * dpr);
```

The canvas draw buffer is set to physical pixels so the iso-contour stroke is sharp on retina displays.

## Attribution

Metaballs were introduced by Jim Blinn in 1982.
Reference: [Wikipedia: Metaballs](https://en.wikipedia.org/wiki/Metaballs).
This implementation is original code, MIT licensed.
