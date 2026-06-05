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
});
