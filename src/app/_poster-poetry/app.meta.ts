import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "poster-poetry",
  title: "Poster Poetry",
  description:
    "A Swiss-style typographic poster that lays out a quote pulled live from a free API.",
  library: "Canvas 2D",
  concepts: ["typography", "data", "interaction"],
  level: 2,
  technique: "generative grid typography on Canvas 2D + a public quotes API",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
