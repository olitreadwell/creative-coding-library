import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "strange-attractor",
  title: "Strange Attractor",
  description:
    "Millions of points follow a chaotic rule and settle into a detailed shape. Arrow keys shift the four parameters.",
  library: "Canvas 2D",
  concepts: ["chaos", "attractor", "interaction"],
  level: 2,
  technique: "de Jong attractor iteration with density accumulation on Canvas 2D",
  source: {
    author: "Peter de Jong",
    title: "de Jong attractor",
    url: "https://paulbourke.net/fractals/peterdejong/",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T15:37:57+12:00",
  prereqs: ["noise-field"],
  understandWhen:
    "You can explain why a tiny parameter change can produce a completely different shape in a chaotic system.",
  predictPrompt:
    "If you nudge one parameter by 0.01, does the shape change gradually or jump to something unrelated?",
});
