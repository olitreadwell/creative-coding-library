## What it is

A fullscreen animated gradient rendered entirely on the GPU using a GLSL fragment shader, driven by a `uTime` uniform updated each frame via the shared `useAnimationFrame` hook.

## Why this concept matters

A fragment shader is a tiny program that runs once per pixel, in parallel, on the GPU. Instead of the CPU looping over thousands of pixels one by one, the GPU runs them all at the same time, which is why shader effects can be smooth at full-screen resolution. The shader receives the pixel's position and the current time as inputs, then outputs a color. By mixing layered sine waves with a cosine palette formula, the output color shifts slowly and organically without any stored state, making it ideal for backgrounds and ambient art.

## Annotated key code

```glsl
// Normalize pixel position to [-1, 1] on the short axis.
// This keeps the effect proportional on any screen size.
vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);

// Domain warp: distort uv with a sum of sines before coloring.
// Two passes at different frequencies create irregular, cloud-like shapes.
float w1 = warp(uv,            uTime * uSpeed);
float w2 = warp(uv * 1.7 + 0.4, uTime * uSpeed * 0.8);
float t  = mix(w1, w2, 0.5);

// Inigo Quilez cosine palette: a + b * cos(TAU * (c*t + d))
// Changing `d` (the phase offset) rotates the hue region.
vec3 col = palette(t,
  vec3(0.5, 0.5, 0.5),   // brightness center
  vec3(0.5, 0.5, 0.5),   // contrast
  vec3(1.0, 1.0, 0.5),   // frequency per channel
  vec3(0.80, 0.53, 0.22) // phase offset — shifted by uSeed to change palette
);

gl_FragColor = vec4(col, 1.0);
```

On the CPU side, `uTime` is updated every frame:

```ts
// useAnimationFrame delivers elapsed seconds since mount.
useAnimationFrame(({ t }) => {
  program.uniforms["uTime"] = { value: t };
  renderer.render({ scene: mesh });
});
```

A `ResizeObserver` calls `renderer.setSize(w, h)` and refreshes `uResolution` so the aspect ratio stays correct when the window is resized.

## Attribution

- Cosine palette technique: [Inigo Quilez — Palettes](https://iquilezles.org/articles/palettes/), used as a reference pattern, not copied verbatim
- Fragment shader concepts: [The Book of Shaders](https://thebookofshaders.com/) by Patricio Gonzalez Vivo, reference only
- WebGL rendering: [ogl](https://github.com/oframe/ogl) by Nathan Gordon, MIT license
- No third-party GLSL source was copied; this implementation is original
