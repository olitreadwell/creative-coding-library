import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "pointer-flow",
  title: "Pointer Flow",
  description:
    "Balloons drift toward your cursor. Click to send a shockwave that pushes them away.",
  library: "Canvas 2D",
  concepts: ["interaction", "physics", "generative"],
  level: 1,
  technique: "shockwave-driven balloon simulation on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T14:51:46+12:00",
  prereqs: [],
  understandWhen:
    "You can explain why each balloon drifts toward the cursor and predict how a wider shockwave radius changes the response.",
  predictPrompt:
    "If you double the shockwave force, what changes: how many balloons move, how far they go, or both?",
});
