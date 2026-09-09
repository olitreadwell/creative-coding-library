## What it is

A live recreation of Chladni figures, the patterns sand forms on a vibrating plate. The plate is modeled as a unit square whose displacement is the sum of two standing-wave modes with mode numbers `a` and `b` swapped between them. Wherever the combined field is zero the plate is still (a node), and the sketch draws a glowing line there. Two sliders pick the modes; the figure shimmers as the modes drift slightly around their targets.

## Why this concept matters

This is superposition made visible: complex structure built by adding simple waves, the same principle behind musical chords, interference, and resonance. The nodal lines are exactly the still points an engineer cares about when a string, a drum, or a bridge vibrates at its natural modes. And the figures are not designed, they are forced by the plate's shape and the math of waves, a clean example of pattern emerging from constraint. The boundary-always-zero and diagonal-symmetry properties are provable from the formula, which makes the sketch a good test bed for property-based testing.

## Annotated key code

```ts
// chladni.ts

// Unit-square plate field: two standing-wave modes summed, modes a and b swapped.
export function chladni(x: number, y: number, a: number, b: number): number {
  const PI = Math.PI;
  return Math.sin(PI * a * x) * Math.sin(PI * b * y) + Math.sin(PI * b * x) * Math.sin(PI * a * y);
}

// Closeness to a node (value 0) as a 0..1 line brightness.
export function nodeIntensity(value: number, width: number): number {
  const t = 1 - Math.abs(value) / width;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
```

The field is evaluated on a fixed 200x200 grid into an `ImageData` buffer once per frame, then scaled up to fill the canvas, which keeps it fast at any size.

## Attribution

- Named for Ernst Chladni (1756-1827), who first demonstrated these figures with a bowed plate and sand.
- Background: https://en.wikipedia.org/wiki/Ernst_Chladni and https://en.wikipedia.org/wiki/Chladni%27s_law
- Original implementation; uses the lab's `useAnimationFrame` for reduced-motion-aware playback.
