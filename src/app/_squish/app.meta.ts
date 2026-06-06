import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "squish",
  title: "Squish",
  description:
    "Grab and fling soft blobs. Each blob is a ring of points held together by springs and internal pressure.",
  library: "Canvas 2D",
  concepts: ["physics", "simulation", "interaction"],
  level: 3,
  technique: "Verlet soft bodies with spring constraints and pressure on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["physics-drops", "metaballs"],
  understandWhen:
    "You can explain how Verlet integration differs from Euler integration and predict what very high spring stiffness does to the blob.",
  predictPrompt:
    "If you crank spring stiffness to its max, does the blob become rigid, jiggle harder, or fall apart?",
});
