import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "physics-drops",
  title: "Physics Drops",
  description: "Colorful bodies fall and stack under gravity with matter.js.",
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
    "You can describe the difference between rigid-body and particle physics and predict how changing restitution changes the bounce.",
  predictPrompt:
    "If you set restitution to 1.0 (perfectly elastic), do the bodies eventually come to rest or keep bouncing indefinitely?",
});
