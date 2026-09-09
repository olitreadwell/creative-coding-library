import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "webcam-ascii",
  title: "Webcam ASCII",
  description:
    "Your camera feed turned into text characters. Bright pixels get dense characters. Dark pixels get spaces.",
  library: "Canvas 2D",
  concepts: ["webcam", "typography", "image-processing"],
  level: 2,
  technique: "glyph density mapping of webcam brightness on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T17:10:58+12:00",
  prereqs: ["webcam-mirror"],
  understandWhen:
    "You can predict which character a very bright or very dark pixel maps to and explain how the density order works.",
  predictPrompt:
    "If you reverse the glyph order, does a bright face appear as dense characters or as spaces?",
  recallChecks: [
    {
      q: "How does the sketch rank characters by visual density?",
      a: "Each character is drawn on a 16 by 16 canvas and the number of filled (non-zero alpha) pixels is counted. Characters are then sorted from fewest filled pixels to most.",
    },
    {
      q: "What luminance formula does the sketch use and why does green have the highest weight?",
      a: "Luminance is 0.299 * r + 0.587 * g + 0.114 * b. Green has the highest weight because human eyes are most sensitive to green wavelengths.",
    },
    {
      q: "How is the camera image mirrored so it reads as a selfie view?",
      a: "ctx.translate(cols, 0) followed by ctx.scale(-1, 1) flips the canvas horizontally before the video is drawn into the sample canvas.",
    },
  ],
});
