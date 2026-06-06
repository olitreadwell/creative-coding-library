import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "shrooms",
  title: "Mushrooms",
  description:
    "A procedural patch of mushrooms that sway gently. Click to grow one, or reseed the patch.",
  library: "Canvas 2D",
  concepts: ["procedural", "generative", "interaction"],
  level: 1,
  technique: "procedural mushroom shapes from primitives on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: [],
  understandWhen:
    "You can describe how randomness determines each mushroom's shape and position, and predict the effect of changing the seed.",
  predictPrompt:
    "If two mushrooms share the same seed value, will they look identical? Why or why not?",
});
