import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "cyclic-ca",
  title: "Cyclic Automaton",
  description:
    "A rock-paper-scissors grid where each color eats the next, settling into rotating spirals.",
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
    "You can explain why spirals emerge from a cyclic eat-or-be-eaten rule and predict what happens with two states instead of many.",
  predictPrompt:
    "If you reduce the number of states to two, does the automaton converge to a fixed state, oscillate, or continue spiraling?",
});
