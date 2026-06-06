## What it is

An interactive browser tool that generates color palettes from a base HSL color using classic harmony schemes, with click-to-copy hex values.

## Why this concept matters

HSL stands for Hue, Saturation, Lightness. It is easier to think about than RGB because hue is a number from 0 to 360 that maps to colors you recognize (0 = red, 120 = green, 240 = blue). Saturation controls how vivid the color is. Lightness controls how bright or dark it is.

Color harmony is the idea that certain hue combinations look good together. Designers use rules like triadic (three colors evenly spaced 120 degrees apart) or complementary (two colors opposite each other at 180 degrees) because these combinations create visual balance. HSL makes these rules easy to implement: just add a fixed number to the hue.

## Annotated key code

```ts
// generatePalette in palette.ts

// Hue offsets (in degrees) for each harmony scheme.
const HUE_OFFSETS: Record<Scheme, number[]> = {
  complementary: [0, 180], // two colors, directly opposite
  analogous: [-30, 0, 30], // three neighboring hues
  triadic: [0, 120, 240], // three evenly spaced
  tetradic: [0, 90, 180, 270], // four, forming a rectangle on the wheel
  monochromatic: [0, 0, 0, 0, 0], // same hue, lightness varies instead
};

export function generatePalette(base: Hsl, scheme: Scheme): Hsl[] {
  // Monochromatic is a special case: hue stays the same, lightness changes.
  if (scheme === "monochromatic") {
    return MONO_LIGHTNESS_STEPS.map((l) => hsl(base.h, base.s, l));
  }

  // For all other schemes, rotate the base hue by each offset.
  // shift() calls hsl() internally, which wraps hue into [0, 360).
  const offsets = HUE_OFFSETS[scheme];
  return offsets.map((dh) => shift(base, dh, 0, 0));
}
```

## Attribution

Original code. No external reference or source material.
