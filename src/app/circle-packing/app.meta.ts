import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "circle-packing",
  title: "Circle Packing",
  description: "Circles drop in one by one and grow until they touch, filling the plane.",
  library: "Canvas 2D",
  concepts: ["generative", "seeded-random", "geometry", "packing"],
  level: 2,
  technique: "greedy grow-until-collision packing with a seeded PRNG",
  source: {
    author: "Creative coding folklore",
    title: "Circle packing",
    url: "https://en.wikipedia.org/wiki/Circle_packing",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
