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
  builtAt: "2026-06-05",
});
