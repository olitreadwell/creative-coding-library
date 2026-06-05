## What it is

A Lissajous figure is a closed (or slowly drifting) curve traced by a point whose x and y positions each oscillate as a sine wave at different frequencies. When the frequency ratio is a simple fraction like 3:2 or 5:4, the curve closes into a recognizable knot or figure-eight shape. This app adds a decay envelope so the curve fades toward the center like a real harmonograph pendulum, and slowly rotates the phase offset over time so the figure morphs continuously.

## Why this concept matters

Parametric curves are one of the most practical tools in creative coding. Instead of drawing lines directly, you describe position as a function of a single parameter (here called `s`). That one shift unlocks an entire family of shapes: change the frequency ratio and you get a completely different knot; change phase and the knot rotates; add decay and it spirals inward. The same idea drives splines, bezier paths, and physics simulations. Once you can write `x(s)` and `y(s)`, almost any smooth curve is within reach.

## Annotated key code

```ts
// curve.ts

// The curve parameter runs from 0 to TAU * 10.
// A longer window lets the decay envelope visibly shrink the amplitude to near zero.
export function lissajousPoint(s: number, params: LissajousParams): Point {
  const { a, b, A, B, phase, decay = 0 } = params;
  // exp(-decay * s) shrinks from 1 toward 0 as s grows,
  // mimicking a pendulum losing energy.
  const envelope = decay > 0 ? Math.exp(-decay * s) : 1;
  return {
    x: A * Math.sin(a * s + phase) * envelope,
    y: B * Math.sin(b * s) * envelope,
  };
}
```

```tsx
// page.tsx

// Each frame, phase advances by PHASE_SPEED * dt (seconds),
// so the figure rotates at a consistent real-time speed regardless of frame rate.
phaseRef.current += PHASE_SPEED * dt;

// Additive blending ("lighter") makes overlapping segments brighten,
// producing the glow effect without any post-processing.
ctx.globalCompositeOperation = "lighter";
```

## Attribution

- Named after Jules Antoine Lissajous, who described these figures in 1857.
- Wikipedia reference: https://en.wikipedia.org/wiki/Lissajous_curve
- Harmonograph connection: https://en.wikipedia.org/wiki/Harmonograph
- Canvas 2D additive blending: MDN Web Docs, `CanvasRenderingContext2D.globalCompositeOperation`
