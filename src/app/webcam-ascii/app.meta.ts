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
});
