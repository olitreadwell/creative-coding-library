import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "webcam-mirror",
  title: "Webcam Mirror",
  description:
    "Your camera feed turned into a grid of dots. Bright pixels get big dots. Dark pixels get small ones.",
  library: "Canvas 2D",
  concepts: ["interaction", "webcam", "image-processing"],
  level: 2,
  technique: "getUserMedia + per-cell brightness sampling on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T14:51:54+12:00",
  prereqs: ["seeded-tilings"],
  understandWhen:
    "You can explain how pixel brightness maps to dot size and predict what a finer grid does to frame rate.",
  predictPrompt:
    "If you halve the cell size, does dot resolution go up, frame rate go down, or both?",
});
