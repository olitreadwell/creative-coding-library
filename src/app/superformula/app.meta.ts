import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "superformula",
  title: "Superformula",
  description:
    "One polar equation draws flowers, stars, and polygons. Change four numbers to morph between shapes.",
  library: "Canvas 2D",
  concepts: ["parametric", "geometry", "generative"],
  level: 2,
  technique: "Gielis superformula polar curve on Canvas 2D",
  source: {
    author: "Johan Gielis",
    title: "Superformula",
    url: "https://en.wikipedia.org/wiki/Superformula",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["maurer-rose"],
  understandWhen:
    "You can predict the petal count from the n value and describe what m controls independent of n.",
  predictPrompt:
    "If you keep n at 4 and raise m from 1 to 8, does the shape add petals, sharpen corners, or shift symmetry?",
});
