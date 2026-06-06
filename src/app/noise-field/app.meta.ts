import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "noise-field",
  title: "Noise Field",
  description:
    "Thousands of particles steered by a smooth noise field. Change the seed to get a different flow.",
  library: "Canvas 2D",
  concepts: ["noise", "particle-system", "color"],
  level: 1,
  technique: "Perlin flow field + additive trails",
  source: {
    author: "Daniel Shiffman",
    title: "The Nature of Code: Flow Fields",
    url: "https://natureofcode.com/",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T07:50:36+12:00",
  prereqs: ["seeded-tilings"],
  understandWhen:
    "You can predict how a new seed changes the flow direction and explain why a larger scale makes the flow smoother.",
  predictPrompt:
    "If you double the noise scale, what changes: flow smoothness, particle speed, or color?",
  recallChecks: [
    {
      q: "How does Perlin noise differ from Math.random()?",
      a: "Perlin noise returns values that change gradually: nearby coordinates return similar values, so the field has smooth curves rather than random jumps.",
    },
    {
      q: "What is a flow field and how do particles use it?",
      a: "A flow field assigns a direction to every point in space. Each particle reads the direction at its current position and moves that way each frame.",
    },
    {
      q: "Why do areas where many particle paths overlap appear brighter?",
      a: "Additive blending adds the color values of overlapping lines, so ten dim strokes at the same spot produce a much brighter result than any one stroke alone.",
    },
  ],
});
