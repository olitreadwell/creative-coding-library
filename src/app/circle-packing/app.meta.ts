import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "circle-packing",
  title: "Circle Packing",
  description:
    "Each circle grows until it touches another. Teaches a greedy space-filling strategy.",
  library: "Canvas 2D",
  concepts: ["generative", "seeded-random", "geometry", "packing"],
  level: 2,
  technique: "greedy grow-until-collision packing with a seeded PRNG",
  source: {
    author: "Creative coding folklore",
    title: "Circle packing",
    url: "https://en.wikipedia.org/wiki/Circle_packing",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-06T11:23:11+12:00",
  prereqs: ["seeded-tilings"],
  understandWhen:
    "You can explain the grow-until-collision rule and predict how pack density changes with a smaller minimum size.",
  predictPrompt:
    "If you cut the minimum circle radius in half, does the canvas end up with more circles, fewer gaps, or both?",
  recallChecks: [
    {
      q: "What is the one rule every circle in this packing follows?",
      a: "Grow until you touch a neighbor or the canvas edge, then stop.",
    },
    {
      q: "Why does the same seed always produce the same packing?",
      a: "A seeded PRNG produces a deterministic sequence of candidate positions, so the same seed gives the same result every run.",
    },
    {
      q: "Why are early circles larger than circles placed later?",
      a: "Early circles find more open space and can grow further before hitting a neighbor. Later circles fill smaller gaps.",
    },
  ],
});
