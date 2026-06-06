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
  recallChecks: [
    {
      q: "How does the grid system decide where each word or line of text lands on the canvas?",
      a: "The canvas is divided into a grid of cells. Text is placed by mapping it to row and column positions, so the layout is determined by grid rules rather than absolute pixel coordinates.",
    },
    {
      q: "Why does the layout change on every reload even with the same quote?",
      a: "A randomized element, such as grid offset, column count, or font weight, is re-seeded each time the page loads, so the same text maps to a different arrangement.",
    },
    {
      q: "What role does the public quotes API play in this sketch?",
      a: "The API supplies the text content at runtime. The canvas code is data-driven: it reads whatever the API returns and flows that text through the grid layout rules, so each visit can show a different quote in a different layout.",
    },
  ],
});
