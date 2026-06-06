import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "metaballs",
  title: "Metaballs",
  description:
    "Blobs that merge when they get close and split when they move apart. Drawn from a shared energy field.",
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
  builtAt: "2026-06-05T10:08:06+12:00",
  prereqs: ["voronoi"],
  understandWhen:
    "You can explain what the threshold value does and predict what happens to blob size when you raise it.",
  predictPrompt: "If you raise the threshold, do the blobs grow, shrink, or pull together?",
});
