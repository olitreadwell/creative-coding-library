import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "mondrian",
  title: "Mondrian",
  description:
    "Recursive rectangle subdivision in the De Stijl style. Click or regenerate for a new composition.",
  library: "Canvas 2D",
  concepts: ["recursion", "generative", "interaction"],
  level: 1,
  technique: "recursive rectangle subdivision on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
