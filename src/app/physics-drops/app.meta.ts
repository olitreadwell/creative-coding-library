import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "physics-drops",
  title: "Physics Drops",
  description:
    "Colored shapes fall, bounce, and stack under gravity. A physics engine handles the collisions.",
  library: "matter.js",
  concepts: ["physics", "rigid-body", "simulation"],
  level: 2,
  technique: "matter.js engine + bodies + built-in render",
  source: {
    author: "Liam Brummitt",
    title: "matter.js",
    url: "https://brm.io/matter-js/",
    license: "MIT",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T08:44:33+12:00",
  prereqs: ["pointer-flow"],
  understandWhen:
    "You can explain what restitution controls and predict how the bounce changes when you set it to 0 versus 1.",
  predictPrompt:
    "If you set restitution to 1.0 (perfectly elastic bounce), do shapes eventually settle or keep bouncing forever?",
});
