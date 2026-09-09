# Reaction Diffusion

## What it is

A real-time Gray-Scott reaction-diffusion simulation running on a 200x150 cell grid, painted onto an HTML canvas and scaled up to fill the screen. Two virtual chemicals (A and B) diffuse at different rates and react with each other, growing spots, stripes, and fingerprint-like textures from a few seeded patches. Hit Reset to reseed and watch a fresh pattern grow from scratch.

## Why this concept matters

Reaction diffusion is the proposed mechanism behind many natural patterns: zebra stripes, leopard spots, coral growth, and neural oscillations. The Gray-Scott equations are a clean, minimal model of that mechanism. Feed and kill parameters shift the pattern between blobs, stripes, spirals, and maze-like forms, making it a rich texture generator for generative art and a concrete introduction to emergence in computation.

## Annotated key code

**Gray-Scott update step (`grayscott.ts`)**

```ts
const reaction = aVal * bVal * bVal;
nextA[idx] = clamp(aVal + (dA * lapA - reaction + feed * (1 - aVal)) * dt, 0, 1);
nextB[idx] = clamp(bVal + (dB * lapB + reaction - (kill + feed) * bVal) * dt, 0, 1);
```

`A * B * B` is the autocatalytic reaction term. One molecule of A meets two of B and all three become B. That positive feedback is what makes patterns grow. The feed term keeps A from depleting entirely; the kill term keeps B from taking over.

**Discrete Laplacian with toroidal boundary (`grayscott.ts`)**

```ts
-1.0 * center + 0.2 * (top + bot + left + right) + 0.05 * (tl + tr + bl + br);
```

Weights sum to zero, ensuring the Laplacian is zero on a uniform field. The toroidal wrap (`(x + 1) % width`) removes boundary effects so patterns tile cleanly.

## Attribution

Gray-Scott model from: Gray, P. & Scott, S. K. (1984). _Chemical Engineering Science_, 39(6), 1087-1097.
Parameter classification from: Pearson, J. E. (1993). _Science_, 261(5118), 189-192.
Reference: [Wikipedia: Reaction-diffusion system](https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system).
This implementation is original code, MIT licensed.
