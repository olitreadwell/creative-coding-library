import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "conway-life",
  title: "Game of Life",
  description:
    "A grid of cells that live or die each step. Four rules produce complex, emergent patterns.",
  library: "Canvas 2D",
  concepts: ["cellular-automata", "generative", "simulation"],
  level: 2,
  technique: "toroidal Conway step + canvas render",
  source: {
    author: "John Conway",
    title: "Game of Life",
    url: "https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T08:44:33+12:00",
  prereqs: ["wolfram-ca"],
  understandWhen:
    "You can apply all four Conway rules to a small grid by hand and get the next generation right.",
  predictPrompt:
    "A 2x2 block of live cells: does it stay alive, die, or keep changing after ten steps?",
});
