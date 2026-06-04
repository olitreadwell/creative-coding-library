import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "r3f-spheres",
  title: "Sphere Field",
  description:
    "A lit 3D field of spheres rippling in a sine wave, built with three.js and React Three Fiber.",
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
  builtAt: "2026-06-05",
});
