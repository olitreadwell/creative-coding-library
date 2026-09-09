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
  recallChecks: [
    {
      q: "What is the perspective divide and what visual effect does it produce?",
      a: "The perspective divide is x / z and y / z: each projected coordinate is divided by the point's depth. Points farther away (larger z) project to smaller screen positions, making near things look large and far things look small.",
    },
    {
      q: "What is the painter's algorithm and why does wireframe use it?",
      a: "The painter's algorithm sorts edges by depth and draws them back-to-front. Far edges are drawn first so near edges paint over them, producing correct overlap without any z-buffer.",
    },
    {
      q: "How does depth tinting help the eye read the 3D shape?",
      a: "Near edges are drawn brighter and far edges dimmer. The brightness gradient mimics how distance and lighting affect real objects, giving the wireframe a clear sense of depth even without filled surfaces.",
    },
  ],
});
