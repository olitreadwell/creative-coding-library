import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "wolfram-ca",
  title: "Elementary CA",
  description: "One-dimensional cellular automata that grow fractal patterns from a single cell.",
  library: "Canvas 2D",
  concepts: ["cellular-automata", "rules", "generative", "emergence"],
  level: 2,
  technique: "Wolfram elementary 1D rules",
  source: {
    author: "Stephen Wolfram",
    title: "Elementary cellular automaton",
    url: "https://en.wikipedia.org/wiki/Elementary_cellular_automaton",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
