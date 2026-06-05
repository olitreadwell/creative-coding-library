import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "pointer-flow",
  title: "Pointer Flow",
  description:
    "Soft blobby balloons that drift toward your cursor and get hit by a shockwave when you click.",
  library: "Canvas 2D",
  concepts: ["interaction", "physics", "generative"],
  level: 1,
  technique: "shockwave-driven balloon simulation on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
