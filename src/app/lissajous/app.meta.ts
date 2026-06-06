import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "lissajous",
  title: "Lissajous",
  description:
    "Two sine waves, one for x and one for y, draw a glowing curve. Change their ratio to change the shape.",
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
  builtAt: "2026-06-05T08:44:33+12:00",
  prereqs: ["gsap-stagger"],
  understandWhen:
    "You can predict the shape of the curve for any whole-number frequency ratio and explain why non-integer ratios never close.",
  predictPrompt:
    "If x-frequency and y-frequency are both 3, what does the curve look like compared to 1:1?",
});
