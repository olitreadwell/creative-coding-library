import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "maurer-rose",
  title: "Maurer Rose",
  description:
    "A rose curve sampled at regular degree steps. Straight lines connect the samples into a glowing web.",
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
  builtAt: "2026-06-06T11:23:11+12:00",
  prereqs: ["lissajous"],
  understandWhen: "You can predict the rough web shape for a given petal count n and step angle d.",
  predictPrompt:
    "If d divides evenly into 360, what does the chord web look like, and why does the step angle change things so much?",
});
