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
});
