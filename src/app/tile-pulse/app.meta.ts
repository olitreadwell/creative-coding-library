import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "tile-pulse",
  title: "Tile Pulse",
  description: "Tiles ripple outward from your cursor. Hover, click, or drag to set off new waves.",
  library: "Canvas 2D",
  concepts: ["interaction", "animation", "generative"],
  level: 2,
  technique: "eased grid animation with pointer influence on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["gsap-stagger"],
  understandWhen:
    "You can explain why easing makes the ripple feel natural and predict how swapping to a linear curve changes the feel.",
  predictPrompt:
    "If you use a linear easing curve instead, does the ripple feel faster, snappier, or more mechanical?",
});
