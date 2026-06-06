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
  recallChecks: [
    {
      q: "What is the eating rule in a cyclic automaton?",
      a: "A cell advances to the next state if at least one neighbor (threshold) already holds that next state. States cycle in order, so no state ever permanently wins.",
    },
    {
      q: "Why do spirals form from a random starting grid?",
      a: "Local eating pressure propagates outward in curved fronts. Because the rule is cyclic, the fronts curve back on themselves and form rotating spirals.",
    },
    {
      q: "What does raising the threshold do to the spiral pattern?",
      a: "A higher threshold requires more neighbors at the next state before a cell advances, so spirals form more slowly and with coarser arms.",
    },
  ],
});
