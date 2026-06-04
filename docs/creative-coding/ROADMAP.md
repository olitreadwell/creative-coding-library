# Roadmap

A leveled curriculum, derived from [`KNOWLEDGE-MAP.md`](./KNOWLEDGE-MAP.md). L1 is broad and non-overlapping; L2 introduces new domains; L3 combines.

## L1 — broad, non-overlapping starters

One app per library family. Each teaches one concept cleanly.

| Suggested slug    | Library          | Concept                           |
| ----------------- | ---------------- | --------------------------------- |
| `gsap-stagger`    | GSAP             | animation + easing + stagger      |
| `noise-field`     | Canvas 2D        | Perlin noise + particle motion    |
| `two-grid`        | two.js           | SVG vector + transforms           |
| `shader-gradient` | raw WebGL or ogl | fragment shader basics + uniforms |
| `hsl-palette`     | plain TS         | color spaces + palette generation |
| `seeded-tilings`  | Canvas 2D        | seeded PRNG + generative grid     |

Goal of L1: cover the rendering substrates (DOM/SVG, Canvas 2D, WebGL, GSAP timeline) without overlap, so L2 can lean on them.

## L2 — new domains

Pulls in a single new domain per app on top of L1 substrates.

| Suggested slug    | Library              | New domain                         |
| ----------------- | -------------------- | ---------------------------------- |
| `r3f-spheres`     | three.js + R3F       | 3D scene graph + camera + lighting |
| `physics-springs` | matter.js            | rigid-body physics                 |
| `mic-spectrum`    | Web Audio + Canvas   | FFT + microphone input             |
| `mandelbrot`      | Canvas 2D            | fractal iteration                  |
| `conway-life`     | Canvas 2D            | cellular automata                  |
| `lsystem-tree`    | Canvas 2D or SVG     | recursion + L-system               |
| `kinetic-type`    | Canvas + opentype.js | typography as shapes               |
| `pointer-trails`  | Canvas 2D            | pointer / touch interaction        |
| `webcam-edges`    | MediaPipe + Canvas   | webcam input + edge detection      |

## L3 — combinations

Now the fun part. Each L3 app combines at least two L1/L2 domains.

| Suggested slug         | Combines                                             |
| ---------------------- | ---------------------------------------------------- |
| `audio-3d-blob`        | Web Audio FFT + three.js mesh deformation            |
| `gsap-shader-uniforms` | GSAP timeline driving fragment-shader uniforms       |
| `physics-trails`       | matter.js bodies + additive blend trails             |
| `audio-generative`     | mic input + generative grid + color palette response |
| `midi-shader`          | Web MIDI controllers driving shader params           |
| `webcam-particles`     | MediaPipe segmentation seeding a particle system     |
| `audio-cellular`       | beat detect stepping a cellular automaton            |
| `r3f-physics`          | R3F + rapier                                         |

## Stretch / data-viz cross-overs

These overlap with the [`data-viz`](../data-viz/ROADMAP.md) bundle:

- `nz-rainfall` — NIWA open data, encoded as a generative grid (data-viz × generative)
- `gh-contrib-rays` — GitHub contribution graph as kinetic typography
- `tube-arrivals-flow` — TfL open data driven flow field

## Order

Curator and builder should walk roughly L1 → L2 → L3, but the schedule does not enforce it. Knowledge-map coverage is the real ordering signal — pick the next `gap` row when in doubt.
