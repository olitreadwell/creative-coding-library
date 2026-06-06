import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "metaballs",
  title: "Metaballs",
  description: "Organic blobs that merge and split, drawn from a scalar field.",
  library: "Canvas 2D",
  concepts: ["metaballs", "implicit-surface", "marching-squares", "fields"],
  level: 2,
  technique: "scalar field + marching squares iso-contour",
  source: {
    author: "Jim Blinn",
    title: "Metaballs",
    url: "https://en.wikipedia.org/wiki/Metaballs",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
  prereqs: ["voronoi"],
  understandWhen:
    "You can explain the threshold value's role and predict what happens to the blobs when you raise it.",
  predictPrompt:
    "If you raise the iso-contour threshold, do the blobs grow, shrink, or merge, and why?",
});
