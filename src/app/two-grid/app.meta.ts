import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "two-grid",
  title: "Vector Grid",
  description: "A pulsing, rotating grid of vector shapes drawn with two.js.",
  library: "two.js",
  concepts: ["vector", "transforms", "generative"],
  level: 1,
  technique: "two.js scene graph + per-shape transform wave",
  source: {
    author: "Jono Brandel",
    title: "two.js",
    url: "https://two.js.org/",
    license: "MIT",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
