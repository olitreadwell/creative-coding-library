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
  recallChecks: [
    {
      q: "What does restitution control in a physics engine?",
      a: "It sets how elastic a collision is. At 0 the object stops dead on impact; at 1 it bounces back at full speed.",
    },
    {
      q: "Why does matter.js use a separate render step instead of drawing directly in your code?",
      a: "The engine updates positions and the built-in renderer draws from those positions, keeping physics logic and rendering decoupled.",
    },
    {
      q: "What happens to stacked shapes when you lower gravity?",
      a: "They take longer to fall and land more gently, so stacks build higher before collapsing.",
    },
  ],
});
