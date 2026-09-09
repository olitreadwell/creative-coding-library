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
  recallChecks: [
    {
      q: "What are the three rules every boid follows each frame?",
      a: "Separation (move away from neighbors that are too close), alignment (steer toward the average heading of nearby neighbors), and cohesion (steer toward the average position of nearby neighbors).",
    },
    {
      q: "Why does the flock form without any code that says 'flock together'?",
      a: "Emergence: each boid follows only local rules, but the interaction of those rules across many boids produces group behavior.",
    },
    {
      q: "What happens to a boid that exits the right edge of the canvas?",
      a: "It reappears on the left edge, because the edges are toroidal.",
    },
  ],
});
