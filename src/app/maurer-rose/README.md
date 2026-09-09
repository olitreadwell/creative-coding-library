## What it is

A Maurer rose is a closed path of 360 straight chords whose endpoints all lie on a rose curve `r = sin(n * theta)`, sampled once every `d` degrees. The coarse angular step makes consecutive points land far apart on the rose, so the connecting lines cut across the flower and overlap into a lacy web. Two integers, `n` and `d`, control the entire figure.

## Why this concept matters

The sketch teaches polar coordinates and sampling in the smallest possible space. Polar thinking (angle plus radius) is the natural language for anything that radiates from a center, and a rose is the cleanest example: one sine wave becomes a flower. The Maurer step then shows that _how often_ you sample a curve changes the result as much as the curve itself, the same principle that underlies digital audio and imaging. Finally it is a tidy demonstration of emergence: no single chord is interesting, yet hundreds of them overlap into structure.

## Annotated key code

```ts
// rose.ts

// Polar to cartesian: distance is a sine wave of the angle.
export function rosePoint(thetaRad: number, n: number, radius: number): Point {
  const r = Math.sin(n * thetaRad) * radius; // petal height (may be negative)
  return { x: r * Math.cos(thetaRad), y: r * Math.sin(thetaRad) };
}

// Sample the rose at 361 coarse angles: 0, d, 2d, ... 360*d degrees.
export function maurerVertices(n: number, d: number, radius: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= 360; i++) {
    pts.push(rosePoint(i * d * DEG_TO_RAD, n, radius));
  }
  return pts;
}
```

The big angular jump `i * d` is the whole trick: it turns short arcs into long chords, and the chords are what overlap into the pattern.

## Attribution

- Maurer rose described by Peter M. Maurer, "A Rose is a Rose...", The American Mathematical Monthly, 1987.
- Wikipedia reference: https://en.wikipedia.org/wiki/Maurer_rose
- Rose (polar) curve background: https://en.wikipedia.org/wiki/Rose_(mathematics)
