import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "webcam-mosaic",
  title: "Webcam Mosaic",
  description:
    "Your camera redrawn live as a grid of text glyphs or sized dots, picked by brightness.",
  library: "Canvas 2D",
  concepts: ["webcam", "image-processing", "typography"],
  level: 2,
  technique: "brightness sampling of a webcam into glyph-density or dot-radius cells on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T17:29:20+12:00",
  prereqs: ["webcam-ascii", "webcam-mirror"],
  understandWhen:
    "You can explain when each mode (glyph vs dot) is better and predict how switching modes affects the perceived detail.",
  predictPrompt:
    "If you use the glyph mode on a very dark scene, do you see fewer characters, smaller characters, or mostly spaces?",
});
