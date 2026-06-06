import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "wireframe",
  title: "Wireframe",
  description:
    "A 3D shape drawn on a flat canvas using rotation matrices and perspective math. Drag to spin it.",
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
    "You can apply a rotation matrix to a 3D point by hand and explain what dividing by depth does to the projection.",
  predictPrompt:
    "If you remove the perspective divide and use orthographic projection, does the shape look flat, stretched, or just less deep?",
});
