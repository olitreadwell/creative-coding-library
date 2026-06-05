import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "webcam-ascii",
  title: "Webcam ASCII",
  description: "Your camera redrawn live as a grid of text glyphs chosen by brightness.",
  library: "Canvas 2D",
  concepts: ["webcam", "typography", "image-processing"],
  level: 2,
  technique: "glyph density mapping of webcam brightness on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
