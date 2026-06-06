import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "webcam-mosaic",
  title: "Webcam Mosaic",
  description:
    "Switch between text characters and dots as your camera output. Both modes map pixel brightness to visual weight.",
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
    "You can explain when glyph mode and dot mode each read better and predict how switching changes the visible detail.",
  predictPrompt:
    "In glyph mode with a very dark scene, do you see fewer characters, smaller ones, or mostly spaces?",
});
