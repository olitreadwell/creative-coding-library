import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "r3f-spheres",
  title: "Sphere Field",
  description:
    "A grid of 3D spheres that ripple in a wave. React Three Fiber wraps three.js in React components.",
  library: "three.js / R3F",
  concepts: ["3d", "scene-graph", "lighting"],
  level: 2,
  technique: "R3F Canvas + useFrame wave animation",
  source: {
    author: "Poimandres",
    title: "react-three-fiber",
    url: "https://r3f.docs.pmnd.rs/",
    license: "MIT",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T08:44:33+12:00",
  prereqs: ["two-grid", "wireframe"],
  understandWhen:
    "You can describe how each R3F component maps to a three.js object and explain what useFrame runs each animation frame.",
  predictPrompt:
    "If you remove the directional light and keep only ambient light, how do the spheres look different?",
  recallChecks: [
    {
      q: "What does useFrame do in React Three Fiber?",
      a: "It registers a callback that runs on every animation frame, letting you update positions, rotations, or uniforms in sync with the render loop.",
    },
    {
      q: "How does a scene graph keep 3D objects organised?",
      a: "Objects are nodes in a tree. Transforming a parent automatically transforms all children, so you can group and animate subtrees together.",
    },
    {
      q: "Why does removing the directional light flatten the apparent depth of the spheres?",
      a: "Directional light casts highlights and shadows that show surface curvature. Ambient-only light is the same from every angle, so the surface looks uniformly lit.",
    },
  ],
});
