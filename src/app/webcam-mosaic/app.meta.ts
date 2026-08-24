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
  recallChecks: [
    {
      q: "What is the only step that differs between glyph mode and circle mode?",
      a: "The final drawing step. Sampling the camera and computing luminance per cell is identical in both modes. Only whether the cell is drawn as a character or a dot is different.",
    },
    {
      q: "Why does glyph mode invert brightness before picking a character, while circle mode does not?",
      a: "Dense characters look dark. A dark cell should map to a dense character (high ink coverage), so brightness is inverted. A large dot looks bright, matching high brightness directly, so no inversion is needed.",
    },
    {
      q: "When is character density measured, and why not on every frame?",
      a: "Density is measured once at startup by drawing each character on a tiny canvas and counting filled pixels. The result is a fixed sorted array, so re-measuring every frame would waste work for data that never changes.",
    },
  ],
});
