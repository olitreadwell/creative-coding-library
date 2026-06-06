import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "noise-field",
  title: "Noise Field",
  description:
    "Thousands of particles steered by a smooth noise field. Change the seed to get a different flow.",
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
  builtAt: "2026-06-05T07:50:36+12:00",
  prereqs: ["seeded-tilings"],
  understandWhen:
    "You can predict how a new seed changes the flow direction and explain why a larger scale makes the flow smoother.",
  predictPrompt:
    "If you double the noise scale, what changes: flow smoothness, particle speed, or color?",
});
