import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "chladni",
  title: "Chladni Figures",
  description: "Standing waves on a vibrating plate trace shifting nodal patterns.",
  library: "Canvas 2D",
  concepts: ["trigonometry", "waves", "superposition", "field"],
  level: 2,
  technique: "sum of two standing-wave modes, nodal lines via ImageData",
  source: {
    author: "Ernst Chladni",
    title: "Chladni figures",
    url: "https://en.wikipedia.org/wiki/Ernst_Chladni",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
