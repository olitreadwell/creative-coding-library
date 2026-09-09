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
  recallChecks: [
    {
      q: "What makes a Lissajous curve parametric rather than a regular y = f(x) curve?",
      a: "Both x and y are computed from a shared variable t, so neither axis depends directly on the other.",
    },
    {
      q: "What does the frequency ratio control in a Lissajous curve?",
      a: "It sets the basic shape: a 1:1 ratio gives an ellipse, and a 3:2 ratio gives a figure with three loops in one direction and two in the other.",
    },
    {
      q: "Why does a non-integer frequency ratio never produce a closed curve?",
      a: "The two sine waves complete their cycles at different times, so the point never returns to exactly where it started.",
    },
  ],
});
