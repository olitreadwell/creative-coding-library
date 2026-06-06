import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "phyllotaxis",
  title: "Phyllotaxis",
  description:
    "Dots placed at the same angle every time pack tightly into spirals. This is how sunflowers arrange their seeds.",
  library: "Canvas 2D",
  concepts: ["phyllotaxis", "generative", "interaction"],
  level: 1,
  technique: "golden-angle seed placement (Vogel's model) on Canvas 2D",
  source: {
    author: "Helmut Vogel",
    title: "A better way to construct the sunflower head",
    url: "https://en.wikipedia.org/wiki/Phyllotaxis",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:10:39+12:00",
  prereqs: [],
  understandWhen:
    "You can state what the golden angle is and explain why that angle produces tight, gap-free packing.",
  predictPrompt: "If you swap the golden angle for 90 degrees, what pattern do you get instead?",
  recallChecks: [
    {
      q: "What is the golden angle and why does it produce even packing?",
      a: "The golden angle is approximately 137.5 degrees. Rotating each seed by this amount places it in the largest available gap, so seeds pack without clustering or leaving holes.",
    },
    {
      q: "Why does each seed sit at distance sqrt(i) from the center?",
      a: "Square root spacing keeps the area of the ring around each seed roughly constant, so seeds at larger radii do not spread out and create gaps.",
    },
    {
      q: "What happens to the pattern when you use 90 degrees instead of the golden angle?",
      a: "Seeds land on four aligned spokes, leaving large empty sectors between them, because 90 divides evenly into 360 and seeds repeat the same four directions.",
    },
  ],
});
