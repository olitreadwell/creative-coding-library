import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "wireframe",
  title: "Wireframe",
  description:
    "A rotating 3D solid drawn in fake 3D with perspective and depth shading. Drag to spin it.",
  library: "Canvas 2D",
  concepts: ["3d-projection", "geometry", "generative"],
  level: 2,
  technique: "rotation matrices + perspective projection on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T14:44:40+12:00",
  prereqs: ["two-grid"],
  understandWhen:
    "You can apply a rotation matrix to a 3D point by hand and explain what the perspective divide does to depth.",
  predictPrompt:
    "If you remove the perspective divide and use an orthographic projection, does the model look flatter, wider, or without foreshortening?",
});
