import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "lissajous",
  title: "Lissajous",
  description: "A glowing harmonograph curve that slowly morphs over time.",
  library: "Canvas 2D",
  concepts: ["trigonometry", "parametric", "animation"],
  level: 2,
  technique: "parametric sine curves + additive glow",
  source: {
    author: "Jules Antoine Lissajous",
    title: "Lissajous curve",
    url: "https://en.wikipedia.org/wiki/Lissajous_curve",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
