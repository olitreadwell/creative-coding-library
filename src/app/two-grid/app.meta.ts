import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "two-grid",
  title: "Vector Grid",
  description:
    "A grid of shapes that pulse and spin in a wave. Each shape is a vector object in a scene graph.",
  library: "two.js",
  concepts: ["vector", "transforms", "generative"],
  level: 1,
  technique: "two.js scene graph + per-shape transform wave",
  source: {
    author: "Jono Brandel",
    title: "two.js",
    url: "https://two.js.org/",
    license: "MIT",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T07:50:36+12:00",
  prereqs: [],
  understandWhen:
    "You can explain what a scene graph is and describe how a wave of transforms moves through the shapes.",
  predictPrompt:
    "If you shift the wave phase by half a cycle for every other row, what does the motion look like?",
});
