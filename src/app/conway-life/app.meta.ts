import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "conway-life",
  title: "Game of Life",
  description: "Conway's cellular automaton evolving from a random seed.",
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
  builtAt: "2026-06-05",
  prereqs: ["wolfram-ca"],
  understandWhen:
    "You can apply the four Conway rules to a 3x3 grid by hand and compute the next generation for the center cell.",
  predictPrompt:
    "A lone live cell with no live neighbors dies. What happens to a 2x2 block of live cells after ten steps?",
});
