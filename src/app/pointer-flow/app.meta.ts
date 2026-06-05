import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "pointer-flow",
  title: "Pointer Flow",
  description: "A field of particles that chases your cursor and scatters when you click.",
  library: "Canvas 2D",
  concepts: ["interaction", "particle-system", "generative"],
  level: 1,
  technique: "pointer-steered particle field on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
