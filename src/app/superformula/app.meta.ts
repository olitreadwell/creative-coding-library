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
  recallChecks: [
    {
      q: "What does the m parameter control in the superformula?",
      a: "m sets the number of symmetry repeats per full rotation. Integer values of m produce m-fold symmetric shapes (petals, points, or teeth).",
    },
    {
      q: "Why does the sketch sample the formula at 720 angles instead of, say, 36?",
      a: "More samples means the curve is approximated by more short line segments, so curves appear smooth rather than as a polygon with visible flat sides.",
    },
    {
      q: "What happens when n1 drops below 1?",
      a: "The shape inverts, producing a star-like form where the lobes point inward rather than outward.",
    },
  ],
});
