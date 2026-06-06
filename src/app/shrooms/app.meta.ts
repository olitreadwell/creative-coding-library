import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "shrooms",
  title: "Mushrooms",
  description:
    "Each mushroom is built from basic shapes using random values. Click to grow one or shuffle the whole patch.",
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
    "You can describe how random values set each mushroom's shape and position and predict what happens when you change the seed.",
  predictPrompt: "If two mushrooms use the same seed value, do they look the same? Why or why not?",
});
