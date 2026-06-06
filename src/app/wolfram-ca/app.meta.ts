import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "wolfram-ca",
  title: "Elementary CA",
  description:
    "A row of cells. Each step, a rule number decides each cell's next state. Simple rules make fractal patterns.",
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
  builtAt: "2026-06-05T10:08:06+12:00",
  prereqs: ["seeded-tilings"],
  understandWhen:
    "You can look up any 3-cell neighborhood in rule 30's table and compute the next state by hand.",
  predictPrompt:
    "If you change the starting seed for rule 110, does the long-term pattern structure change, or just where it starts?",
});
