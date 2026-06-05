import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "squish",
  title: "Squish",
  description: "Squishy soft-body blobs you can grab and fling, built from springs and pressure.",
  library: "Canvas 2D",
  concepts: ["physics", "simulation", "interaction"],
  level: 3,
  technique: "Verlet soft bodies with spring constraints and pressure on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
