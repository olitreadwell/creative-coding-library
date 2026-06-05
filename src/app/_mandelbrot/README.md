# Mandelbrot Set

## What it is

An interactive Mandelbrot set renderer built on an HTML canvas. Every pixel is colored by how quickly the corresponding complex number escapes to infinity — a technique called escape-time iteration. Click anywhere to zoom into that point. A Reset button restores the default view. The current zoom level is shown in the header.

## Why this concept matters

The Mandelbrot set is the boundary between order and chaos in a very simple iterative rule: take a complex number c, start at z = 0, and keep computing z = z^2 + c. If the result stays bounded forever, c is "in the set" (shown black). If it escapes, c is colored by how fast it left. The resulting shape has infinite self-similar detail at every scale, which makes it a classic entry point for both fractal geometry and generative art.

## Annotated key code

**Escape-time loop (`fractal.ts`)**

```ts
while (iter < maxIter) {
  const zx2 = zx * zx;
  const zy2 = zy * zy;
  if (zx2 + zy2 > 4) {
    // Smooth coloring: log(log(|z|)) / log(2) removes discrete banding.
    const logZabs = Math.log(zx2 + zy2) / 2;
    const nu = Math.log(logZabs / Math.LN2) / Math.LN2;
    return iter + 1 - nu;
  }
  zy = 2 * zx * zy + cy;
  zx = zx2 - zy2 + cx;
  iter++;
}
return maxIter; // in the set
```

`|z|^2 > 4` is the standard escape radius squared. The fractional correction (`nu`) turns the staircase of integer iteration counts into a smooth gradient.

**Pixel-to-complex mapping (`fractal.ts`)**

```ts
const x = view.centerX + (px / width - 0.5) * view.span * aspectRatio;
const y = view.centerY - (py / height - 0.5) * view.span;
```

Canvas y increases downward; complex y increases upward, so the sign flips for y.

**Per-pixel color (`page.tsx`)**

The smooth escape count is normalized to [0, 1] and cycled through hues six times so deep boundary regions show rich color bands, not a single rainbow sweep.

**ImageData rendering (`page.tsx`)**

The entire frame is written into an `ImageData` buffer then pushed to the canvas with a single `putImageData` call, which is faster than individual `fillRect` calls per pixel.

## Attribution

The Mandelbrot set was described by Benoit Mandelbrot in 1980.
Reference: [Wikipedia: Mandelbrot set](https://en.wikipedia.org/wiki/Mandelbrot_set).
Smooth coloring method from the escape-time literature (Inigo Quilez and others).
This implementation is original code, MIT licensed.
