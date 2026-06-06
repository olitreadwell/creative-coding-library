import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "seeded-tilings",
  title: "Seeded Tilings",
  description:
    "Curved tiles that form flowing patterns. The same seed always makes the same result. Teaches seeded randomness.",
  library: "Canvas 2D",
  concepts: ["randomness", "generative", "tiling"],
  level: 1,
  technique: "seeded Truchet tiles + arc rendering",
  source: {
    author: "Sebastien Truchet",
    title: "Truchet tiles",
    url: "https://en.wikipedia.org/wiki/Truchet_tiles",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T07:50:36+12:00",
  prereqs: [],
  understandWhen:
    "You can predict whether two seeds produce the same pattern and explain what makes the result repeat exactly.",
  predictPrompt:
    "Same seed, double the tile size: does the pattern look the same, just bigger, or completely different?",
});
