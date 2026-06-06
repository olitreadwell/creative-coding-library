import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "strange-attractor",
  title: "Strange Attractor",
  description:
    "Millions of points settle into an intricate shape from a simple chaotic rule. Use the arrow keys to morph it.",
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
  builtAt: "2026-06-05",
  prereqs: ["noise-field"],
  understandWhen:
    "You can explain why small parameter changes produce radically different shapes and predict whether nearby parameters look similar.",
  predictPrompt:
    "If you nudge one parameter by 0.01, does the attractor shape change gradually or jump to a completely different form?",
});
