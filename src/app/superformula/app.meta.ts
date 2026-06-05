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
});
