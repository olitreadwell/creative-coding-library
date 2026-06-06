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
});
