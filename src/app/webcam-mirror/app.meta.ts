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
  recallChecks: [
    {
      q: "What are the three steps in the webcam-mirror pipeline?",
      a: "Request camera access with getUserMedia, draw the video frame into a small offscreen canvas and read pixel values back with getImageData, then draw a dot for each cell sized by the luminance of that cell.",
    },
    {
      q: "Why is the video drawn into a small offscreen canvas rather than reading full camera resolution pixels?",
      a: "getImageData on a small canvas (one pixel per dot cell) returns only the bytes needed. Reading the full camera resolution would return far more data than required, slowing down each frame.",
    },
    {
      q: "What does the Okabe-Ito color ramp provide over a standard red-to-green ramp?",
      a: "It avoids the red-green axis, so the color mapping reads correctly for people with the most common forms of color vision difference.",
    },
  ],
});
