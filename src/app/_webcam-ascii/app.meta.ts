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
  prereqs: ["webcam-mirror"],
  understandWhen:
    "You can predict which character appears for a very bright region versus a very dark one and explain the glyph density ordering.",
  predictPrompt:
    "If you reverse the glyph density order, does a bright face appear as dark characters or as the same characters?",
});
