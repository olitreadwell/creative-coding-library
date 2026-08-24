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
  recallChecks: [
    {
      q: "What is a seeded random number generator?",
      a: "A PRNG that produces the same sequence of numbers every time you give it the same starting value, making random results reproducible.",
    },
    {
      q: "What choice does each Truchet tile make?",
      a: "Each tile draws one of two possible arc orientations. The seed determines which orientation lands in each cell.",
    },
    {
      q: "How do you get a completely different pattern without changing the tile logic?",
      a: "Change the seed. The same arc rules run, but a different sequence of orientations produces a different visual result.",
    },
  ],
});
