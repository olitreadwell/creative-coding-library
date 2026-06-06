import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "noise-field",
  title: "Noise Field",
  description: "Thousands of particles flowing through an animated Perlin noise field.",
  library: "Canvas 2D",
  concepts: ["noise", "particle-system", "color"],
  level: 1,
  technique: "Perlin flow field + additive trails",
  source: {
    author: "Daniel Shiffman",
    title: "The Nature of Code: Flow Fields",
    url: "https://natureofcode.com/",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
