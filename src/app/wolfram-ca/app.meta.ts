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
  recallChecks: [
    {
      q: "How does a rule number like 30 or 90 map to cell update decisions?",
      a: "A rule number is an 8-bit integer. Each of the 8 possible 3-cell neighborhoods maps to one bit. The bit at position (neighborhood) in the rule number tells you whether the next cell should be alive (1) or dead (0).",
    },
    {
      q: "How is the 3-cell neighborhood encoded as a number to look up the rule?",
      a: "The left cell is the most significant bit, the right cell is the least significant bit. For example, neighborhood 110 encodes as (1 << 2) | (1 << 1) | 0 = 6. The rule bit is then (rule >> 6) & 1.",
    },
    {
      q: "Why does the sketch use ImageData instead of drawing one rectangle per cell?",
      a: "ImageData lets you write all cell colors into a pixel byte array in one pass and paint everything with a single putImageData call. Drawing one rectangle per cell would make thousands of draw calls per frame, which is much slower.",
    },
  ],
});
