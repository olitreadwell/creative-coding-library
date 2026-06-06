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
});
