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
  prereqs: ["gsap-stagger"],
  understandWhen:
    "You can predict the shape of the curve for any integer frequency ratio and explain why non-integer ratios produce open paths.",
  predictPrompt:
    "If the x-frequency and y-frequency are both 3, what does the curve look like compared to 1:1?",
});
