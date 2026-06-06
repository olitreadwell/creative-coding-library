import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "seasons",
  title: "Seasons",
  description: "Flowing forms whose colors drift through spring, summer, autumn, and winter.",
  library: "Canvas 2D",
  concepts: ["color", "generative", "interaction"],
  level: 1,
  technique: "flow-curve ribbons with season palette interpolation on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
  prereqs: ["hsl-palette"],
  understandWhen:
    "You can describe how palette interpolation produces the color transition between seasons without inspecting the code.",
  predictPrompt:
    "If you remove the interpolation step and snap directly between palettes, what would the visual change look like?",
});
