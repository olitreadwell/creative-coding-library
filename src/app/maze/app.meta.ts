import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "maze",
  title: "Maze",
  description: "A perfect maze carved live by depth-first backtracking.",
  library: "Canvas 2D",
  concepts: ["maze", "graph", "recursion", "generative"],
  level: 2,
  technique: "recursive backtracker carving",
  source: {
    author: "Maze generation",
    title: "Maze generation algorithm",
    url: "https://en.wikipedia.org/wiki/Maze_generation_algorithm",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
