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
  recallChecks: [
    {
      q: "What does the phase offset do for each tile in Tile Pulse?",
      a: "It gives each tile a different starting point in the animation cycle, so tiles along the same diagonal animate together and tiles at different positions animate at different times, producing the travelling wave.",
    },
    {
      q: "Why is pointer position stored in a ref rather than React state?",
      a: "Refs update without triggering a re-render. Storing fast-changing pointer data in state would cause a React re-render on every pointer move, making the animation stutter.",
    },
    {
      q: "What does radial falloff control in the cursor hover effect?",
      a: "It determines how far the cursor's influence reaches. The falloff function returns 1 at distance 0 and fades to 0 at the edge of the influence radius.",
    },
  ],
});
