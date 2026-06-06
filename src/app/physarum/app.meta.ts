import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "physarum",
  title: "Physarum Letters",
  description:
    "A slime-mold simulation whose trails grow into words, drifting through wind, water, fire, and grass.",
  library: "Canvas 2D",
  concepts: ["agents", "simulation", "generative"],
  level: 3,
  technique: "Physarum agent simulation with a text mask on Canvas 2D",
  source: {
    author: "Sage Jenson / Jeff Jones",
    title: "Physarum",
    url: "https://cargocollective.com/sagejenson/physarum",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
  prereqs: ["boids", "reaction-diffusion"],
  understandWhen:
    "You can describe the sense-rotate-move-deposit loop and predict what raising the sensor angle does to trail shape.",
  predictPrompt:
    "If you increase the sensor angle from narrow to wide, do the trails become broader, thinner, or more tangled?",
});
