import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "poster-poetry",
  title: "Poster Poetry",
  description:
    "A typographic poster built from a live quote API. Grid rules place the text. The layout changes each reload.",
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
    "You can describe the grid rules and explain how the API text gets mapped onto the canvas layout.",
  predictPrompt:
    "If the API returns a quote much longer than normal, what breaks first: font size, line breaks, or margins?",
});
