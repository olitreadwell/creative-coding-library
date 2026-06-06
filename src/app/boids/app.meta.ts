import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "boids",
  title: "Boids",
  description: "A flock of dots that moves like birds. No leader. Three rules do all the work.",
  library: "Canvas 2D",
  concepts: ["flocking", "steering", "simulation", "vectors"],
  level: 2,
  technique: "Reynolds boids: separation, alignment, cohesion",
  source: {
    author: "Craig Reynolds",
    title: "Boids",
    url: "https://en.wikipedia.org/wiki/Boids",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T10:08:06+12:00",
  prereqs: ["pointer-flow"],
  understandWhen:
    "You can name all three rules and predict which one breaks the flock if you turn it off.",
  predictPrompt:
    "If you turn off separation but keep alignment and cohesion, what happens to the flock over time?",
});
