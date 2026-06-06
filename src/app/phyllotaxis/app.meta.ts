import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "phyllotaxis",
  title: "Phyllotaxis",
  description:
    "The golden-angle spiral that nature uses for sunflowers and pinecones. Scroll to grow the bloom.",
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
  builtAt: "2026-06-05",
  prereqs: [],
  understandWhen:
    "You can state what the golden angle is and explain why that specific angle produces gap-free packing.",
  predictPrompt: "If you replace the golden angle with 90 degrees, what pattern appears and why?",
});
