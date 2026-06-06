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
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["hsl-palette"],
  understandWhen:
    "You can describe the grid layout rules and explain how the API response maps onto the canvas typography.",
  predictPrompt:
    "If the quote is much longer than expected, what part of the layout breaks first: the font size, the line breaks, or the margins?",
});
