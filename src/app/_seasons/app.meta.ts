import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "seasons",
  title: "Seasons",
  description:
    "Ribbons drift across the screen. Their colors blend from one season palette to the next over time.",
  library: "Canvas 2D",
  concepts: ["color", "generative", "interaction"],
  level: 1,
  technique: "flow-curve ribbons with season palette interpolation on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["hsl-palette"],
  understandWhen:
    "You can describe how blending between two color palettes produces a smooth transition and predict the midpoint colors.",
  predictPrompt:
    "If you remove the blend step and snap directly between palettes, what does the transition look like?",
});
