import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "boids",
  title: "Boids",
  description: "A flock that emerges from three simple steering rules.",
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
  builtAt: "2026-06-05",
});
