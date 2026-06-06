import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "superformula",
  title: "Superformula",
  description:
    "One equation that morphs into flowers, stars, and polygons as you change four numbers.",
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
  builtAt: "2026-06-05",
  prereqs: ["maurer-rose"],
  understandWhen:
    "You can predict how many petals a given n value produces and describe what m controls separately from n.",
  predictPrompt:
    "If you set n to 4 and raise m from 1 to 8, does the shape add petals, sharpen corners, or change symmetry?",
});
