# Knowledge Map

The tree of concepts this lab is teaching. Libraries are vehicles. Concepts overlap. This file tracks coverage.

## How to use

- Pick a concept that is **gap** or **partial**.
- Find a library that embodies it (see overlap column).
- Add an `app-idea` issue, or let the curator run pick it up.
- After build, edit this file: flip the row to **partial** or **covered** and link the app slug.

## Top-level concepts

| Concept                         | Sub-concepts                                 | Vehicles (libraries)             | Coverage             | Apps |
| ------------------------------- | -------------------------------------------- | -------------------------------- | -------------------- | ---- |
| Coordinate systems / transforms | translate, scale, rotate, matrix, DPR        | Canvas 2D, SVG, three.js, GSAP   | gap                  |      |
| Vectors / trig                  | dot, cross, polar, angles                    | plain TS, three.js, two.js       | gap                  |      |
| Animation / easing              | rAF, tween, spring, stagger                  | GSAP, motion, plain TS           | gap                  |      |
| Randomness / noise              | seeded PRNG, value noise, Perlin, Simplex    | plain TS (in `src/lib/creative`) | partial (lib seeded) |      |
| Color                           | HSL/HSV, palette, gradient, contrast         | plain TS, culori                 | partial (lib seeded) |      |
| Generative systems              | grids, tilings, recursion                    | Canvas 2D, SVG                   | gap                  |      |
| Particle systems                | emitters, fields, integration                | Canvas 2D, three.js, regl        | gap                  |      |
| Physics                         | rigid body, springs, soft body               | matter.js, rapier, p2            | gap                  |      |
| Recursion / fractals            | L-systems, IFS, Mandelbrot family            | Canvas 2D, GLSL shaders          | gap                  |      |
| Cellular automata               | Conway, totalistic, Wolfram                  | Canvas 2D                        | gap                  |      |
| Shaders / GPU pipeline          | full-screen quad, fragment, vertex, uniforms | regl, three.js, ogl, raw WebGL   | gap                  |      |
| 3D math                         | scene graph, camera, lighting, models        | three.js, R3F, ogl, babylon      | gap                  |      |
| Audio analysis                  | FFT, beat detect, mic input                  | Web Audio API, Meyda             | gap                  |      |
| Pointer / touch input           | drag, gestures, pressure                     | plain TS, use-gesture            | gap                  |      |
| Webcam input                    | video frame, segmentation                    | MediaStream, MediaPipe           | gap                  |      |
| MIDI input                      | notes, CC, controllers                       | Web MIDI                         | gap                  |      |
| Audio output / synthesis        | osc, env, FX                                 | Web Audio, Tone.js               | gap                  |      |
| Typography                      | variable fonts, text-as-shape, kinetic type  | Canvas, SVG, opentype.js         | gap                  |      |
| Data viz                        | open data fetch, encode, render              | d3, Visx, Observable Plot        | gap                  |      |

Coverage values: `gap` | `partial` | `covered`. Update when an app lands.

## Library × concept overlap

A library that embodies many concepts is worth touching early. A library that uniquely embodies one concept is worth touching once.

| Library                         | Embodies                                                           |
| ------------------------------- | ------------------------------------------------------------------ |
| Canvas 2D (browser)             | transforms, color, generative, particles, fractals, CA, typography |
| SVG                             | transforms, color, generative, typography                          |
| three.js                        | 3D math, shaders, scene graph, particles, post-processing          |
| R3F                             | three.js in React                                                  |
| GSAP                            | animation, easing, stagger, timeline                               |
| motion (formerly framer-motion) | animation, gestures (React)                                        |
| two.js                          | SVG-vector renderer                                                |
| matter.js                       | physics (rigid body)                                               |
| rapier                          | physics (rigid body, soft body)                                    |
| regl                            | WebGL functional wrapper                                           |
| ogl                             | tiny WebGL helper                                                  |
| Web Audio API                   | audio analysis, synthesis                                          |
| Tone.js                         | audio synthesis, sequencing                                        |
| Meyda                           | audio feature extraction                                           |
| MediaPipe                       | webcam input, segmentation, pose                                   |
| d3                              | data viz primitives, scales                                        |
| Observable Plot                 | grammar-of-graphics layer over d3                                  |
| Visx                            | d3 in React                                                        |
| culori                          | color science                                                      |
| opentype.js                     | font geometry                                                      |

## Interaction modalities (cross-cutting)

- Pointer / touch / drag
- Keyboard
- Webcam
- Microphone / audio in
- MIDI controller
- Sensor (gyro / accel) on mobile
- URL query string (deep-linkable presets)

Each L2+ app should pick at least one. Track which modalities each app supports in `app.meta.ts` via `concepts[]`.
