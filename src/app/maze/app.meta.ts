import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "maze",
  title: "Maze",
  description:
    "Watch a maze carve itself. It drills deep, backs up when stuck, and never leaves a loop.",
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
  builtAt: "2026-06-05T10:08:06+12:00",
  prereqs: ["lsystem-tree"],
  understandWhen:
    "You can trace the depth-first backtracking steps on a 3x3 grid by hand and say why the result has no loops.",
  predictPrompt:
    "If you switch from depth-first to breadth-first search, does the maze look different?",
});
