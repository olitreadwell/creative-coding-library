## What it is

A 12x12 grid of 144 metallic spheres that bob up and down in a traveling sine wave. The whole field slowly auto-rotates. Each sphere is colored by its wave height using HSL, shifting from cyan through violet as it crests. The scene is lit by a cool purple point light and a warm orange backlight to give depth.

## Why this concept matters

The scene graph is one of the fundamental ideas in 3D graphics. In three.js (and R3F), every object lives inside a tree. Grouping all 144 spheres under a single `<group>` means one rotation command spins the entire field, and the individual sphere positions are expressed in local coordinates relative to that group. This is the same pattern you find in game engines, CAD tools, and animation rigs.

`InstancedMesh` is the key performance tool here. Rendering 144 separate draw calls would be wasteful; instancing lets the GPU render all 144 spheres in a single draw call. Each instance gets its own transform matrix and color, updated every frame via `setMatrixAt` and `setColorAt`.

The `useFrame` hook is R3F's per-frame callback. It receives the renderer state (including `state.clock.getElapsedTime()`) and runs once per animation frame, making it the right place to advance any time-dependent simulation.

## Annotated key code

```ts
// field.ts

// Returns a y-offset for sphere (col, row) at time t.
// The traveling wave emerges because phase depends on col+row,
// so adjacent spheres are slightly offset in time.
export function bob(col: number, row: number, t: number): number {
  const phase = (col + row) * WAVE_SPATIAL_FREQ;
  return Math.sin(phase - t * WAVE_TEMPORAL_FREQ) * WAVE_AMPLITUDE;
}
```

```tsx
// page.tsx (inside useFrame callback)

// Update each instance's transform and color every frame.
// tempObject is a reusable Object3D — calling updateMatrix() bakes
// the position/scale/rotation into a Matrix4 that the GPU can consume.
tempObject.position.set(pos.x, y, pos.z);
tempObject.scale.setScalar(scale);
tempObject.updateMatrix();
mesh.setMatrixAt(i, tempObject.matrix);

// instanceMatrix and instanceColor must be flagged as dirty so
// three.js uploads the updated buffer to the GPU this frame.
mesh.instanceMatrix.needsUpdate = true;
if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
```

## Attribution

- React Three Fiber by Poimandres (https://r3f.docs.pmnd.rs/), MIT license
- three.js by mrdoob and contributors (https://threejs.org/), MIT license
- Instanced mesh pattern from the R3F documentation examples
