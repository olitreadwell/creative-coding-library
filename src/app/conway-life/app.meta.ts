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
  recallChecks: [
    {
      q: "State the four Conway rules: when does a live cell survive, when does it die, and when does a dead cell become alive?",
      a: "A live cell with 2 or 3 live neighbors survives. A live cell with fewer than 2 dies (underpopulation). A live cell with more than 3 dies (overpopulation). A dead cell with exactly 3 live neighbors becomes alive (reproduction).",
    },
    {
      q: "What does 'toroidal grid' mean in the context of this simulation?",
      a: "The edges wrap around: a cell at the right border neighbors cells at the left border, so every cell always has exactly eight neighbors.",
    },
    {
      q: "What is emergence in the context of Conway's Game of Life?",
      a: "Patterns like gliders and oscillators appear from the four rules alone. No code names or programs those patterns directly.",
    },
  ],
});
