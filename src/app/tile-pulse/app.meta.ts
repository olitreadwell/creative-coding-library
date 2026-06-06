import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "tile-pulse",
  title: "Tile Pulse",
  description:
    "A grid of geometric tiles that ripple under your cursor. Hover, click, and drag to stir them.",
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
    "You can explain why easing makes the ripple feel organic and predict how a linear ease changes the feel.",
  predictPrompt:
    "If you replace the easing curve with a linear one, does the tile ripple feel faster, snappier, or more mechanical?",
});
