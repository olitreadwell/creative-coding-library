import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "voronoi",
  title: "Voronoi",
  description:
    "Each cell owns the area closest to one site. Click to add a site and watch the cells rearrange.",
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
    "You can explain what nearest-site means and predict how a new site inside a large cell splits the diagram.",
  predictPrompt:
    "If you click the center of the largest cell to add a site, how many new edges appear?",
});
