import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "seeded-tilings",
  title: "Seeded Tilings",
  description: "Deterministic Truchet tile patterns you can re-roll with a seed.",
  library: "Canvas 2D",
  concepts: ["randomness", "generative", "tiling"],
  level: 1,
  technique: "seeded Truchet tiles + arc rendering",
  source: {
    author: "Sebastien Truchet",
    title: "Truchet tiles",
    url: "https://en.wikipedia.org/wiki/Truchet_tiles",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
