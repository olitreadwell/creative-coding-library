import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "maurer-rose",
  title: "Maurer Rose",
  description: "Hundreds of straight chords across a rose curve weave a glowing web.",
  library: "Canvas 2D",
  concepts: ["trigonometry", "polar", "parametric", "generative"],
  level: 2,
  technique: "polar rose sampled at integer degree steps + chord web",
  source: {
    author: "Peter M. Maurer",
    title: "A Rose is a Rose...",
    url: "https://en.wikipedia.org/wiki/Maurer_rose",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
  prereqs: ["lissajous"],
  understandWhen:
    "You can predict the rough shape of the web for any combination of petal count n and step angle d.",
  predictPrompt:
    "If d is a divisor of 360, what happens to the chord web, and why does the step angle matter so much?",
});
