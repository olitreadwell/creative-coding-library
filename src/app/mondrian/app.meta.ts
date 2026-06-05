import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "mondrian",
  title: "Mondrian",
  description:
    "De Stijl panels at multiple depths fall toward the camera. Perspective scaling and depth-of-field alpha create an endless 3D tunnel from pure Canvas 2D math.",
  library: "Canvas 2D",
  concepts: ["recursion", "generative", "animation", "perspective", "depth-of-field"],
  level: 2,
  technique: "perspective projection + recursive subdivision + depth-of-field alpha on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
