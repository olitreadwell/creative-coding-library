## What it is

Forty colorful circles and polygons fall from the top of the screen, collide with each other, and stack into a pile at the bottom. Two buttons let you drop a fresh burst of bodies or restart the whole scene with a new random seed.

## Why this concept matters

Rigid-body simulation means treating each shape as a solid object with mass, friction, and bounciness. A physics engine like matter.js solves hundreds of collision equations every frame so you do not have to. The key ideas are:

- **Gravity** pulls every body downward each tick.
- **Constraints** (the static floor and walls) are bodies that never move.
- **Collision detection** finds which shapes are touching and computes how they should push apart and spin.
- **Seeded randomness** makes each drop deterministic: the same seed always produces the same pile.

This is the foundation of game physics, cloth simulation, and particle systems.

## Annotated key code

```ts
// bodies.ts - pure, no DOM or matter-js

// A BodySpec describes one body: position, shape, color.
// It carries no DOM references so it is safe to test in Node.
export type BodySpec = {
  x: number;
  kind: 'circle' | 'poly';
  size: number;
  sides: number;   // 0 for circles
  hue: number;     // degrees [0, 360)
};

// makeSpecs uses a seeded PRNG so the same seed reproduces
// the same layout. All randomness flows through one `rng()` call.
export function makeSpecs(rng: Rng, count: number, width: number): BodySpec[] { ... }
```

```ts
// page.tsx - client component

// Dynamic import keeps matter-js out of the SSR bundle.
import("matter-js").then((mod) => {
  const M = mod.default ?? mod;
  matterRef.current = M;
  initScene(M, container, seedRef.current);
});

// Bodies are staggered by 35 ms each, so they arrive
// in a stream rather than all at once.
scene.dropTimer = setInterval(() => {
  M.Composite.add(engine.world, buildBody(M, specs[i], -spec.size * 2));
  i++;
}, DROP_INTERVAL_MS);

// Cleanup on unmount: stop render loop, stop runner,
// clear world and engine, remove canvas from DOM.
M.Render.stop(render);
M.Runner.stop(runner);
M.World.clear(engine.world, false);
M.Engine.clear(engine);
```

## Attribution

- Physics engine: [matter.js](https://brm.io/matter-js/) by Liam Brummitt, MIT license.
- Random number generation: mulberry32 PRNG, adapted in `@/lib/creative/random`.
