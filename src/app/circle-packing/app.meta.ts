import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "circle-packing",
  title: "Circle Packing",
  description:
    "Each circle grows until it touches another. Teaches a greedy space-filling strategy.",
  library: "Canvas 2D",
  concepts: ["generative", "seeded-random", "geometry", "packing"],
  level: 2,
  technique: "greedy grow-until-collision packing with a seeded PRNG",
  source: {
    author: "Creative coding folklore",
    title: "Circle packing",
    url: "https://en.wikipedia.org/wiki/Circle_packing",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-06T11:23:11+12:00",
  prereqs: ["seeded-tilings"],
  understandWhen:
    "You can explain the grow-until-collision rule and predict how pack density changes with a smaller minimum size.",
  predictPrompt:
    "If you cut the minimum circle radius in half, does the canvas end up with more circles, fewer gaps, or both?",
});
