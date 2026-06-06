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
  recallChecks: [
    {
      q: "What rule defines which cell a point belongs to in a Voronoi diagram?",
      a: "Every point belongs to whichever site is closest to it. That nearest-neighbor rule alone defines the entire diagram.",
    },
    {
      q: "Why does the sketch compare squared distances instead of actual distances?",
      a: "Squaring both distances preserves the winner of the comparison without needing Math.sqrt. This removes a square root computation for every cell checked on every frame.",
    },
    {
      q: "How does the 6-pixel downsampled grid keep the animation fast?",
      a: "Instead of checking every pixel, the canvas is divided into 6-pixel cells and only the center pixel is checked. This reduces the number of nearest-site computations by a factor of 36.",
    },
  ],
});
