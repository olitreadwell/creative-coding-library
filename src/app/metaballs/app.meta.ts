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
  recallChecks: [
    {
      q: "What does the threshold value control in the metaball field?",
      a: "It sets the field strength at which the visible outline is drawn: a higher threshold means only points very close to a ball exceed it, making blobs smaller.",
    },
    {
      q: "Why do two nearby blobs merge into one shape?",
      a: "Their individual field contributions add together, so the region between them rises above the threshold and gets included in the outline.",
    },
    {
      q: "What does marching squares do to turn the scalar field into a visible blob outline?",
      a: "It checks each grid cell corner against the threshold, looks up which edge pattern applies, and places a short line segment to trace the boundary.",
    },
  ],
});
