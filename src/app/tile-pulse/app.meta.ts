import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "tile-pulse",
  title: "Tile Pulse",
  description:
    "A grid of geometric tiles that ripple under your cursor. Hover, click, and drag to stir them.",
  library: "Canvas 2D",
  concepts: ["interaction", "animation", "generative"],
  level: 2,
  technique: "eased grid animation with pointer influence on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
