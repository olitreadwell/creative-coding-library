import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "voronoi",
  title: "Voronoi",
  description:
    "The plane split into cells around moving sites, each point belonging to its nearest one. Click to add a site.",
  library: "Canvas 2D",
  concepts: ["voronoi", "generative", "interaction"],
  level: 2,
  technique: "nearest-site partition on a downsampled grid, Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["circle-packing"],
  understandWhen:
    "You can describe what the nearest-site partition means and predict how adding a site in a large cell changes the diagram.",
  predictPrompt:
    "If you add a new site exactly at the center of the largest cell, how many new cell edges appear?",
});
