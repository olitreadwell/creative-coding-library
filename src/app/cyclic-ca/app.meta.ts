import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "cyclic-ca",
  title: "Cyclic Automaton",
  description:
    "A rock-paper-scissors grid. Each color eats the next one. Spirals emerge on their own.",
  library: "Canvas 2D",
  concepts: ["cellular-automata", "simulation", "generative"],
  level: 2,
  technique: "cyclic cellular automaton on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["conway-life"],
  understandWhen:
    "You can explain why spirals appear from the eat-or-be-eaten rule and predict what two states produces instead of many.",
  predictPrompt:
    "If you drop the number of states to two, does the grid settle to one color, flip between two, or keep spiraling?",
});
