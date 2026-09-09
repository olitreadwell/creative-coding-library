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
  recallChecks: [
    {
      q: "What is a scene graph and how does two.js use one?",
      a: "A scene graph is an internal list of all shapes. You update a shape's properties (rotation, scale, fill) and the library reads those changes and redraws the scene for you, so you never call a draw function directly.",
    },
    {
      q: "How does the travelling wave work in Vector Grid?",
      a: "Each square's pulse uses sin(time - distance * spread). Subtracting distance from the time value delays the wave for shapes farther from the center, making it appear to travel outward.",
    },
    {
      q: "Why do corner squares rotate faster than the center square?",
      a: "Rotation speed is 0.008 + distance * 0.014. Corner squares have distance close to 1, giving speed near 0.022, while the center square has distance 0, giving speed 0.008.",
    },
  ],
});
