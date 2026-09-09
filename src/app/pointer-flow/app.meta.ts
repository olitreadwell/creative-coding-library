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
  recallChecks: [
    {
      q: "How does each balloon decide which direction to drift?",
      a: "It calculates the vector from its current position to the cursor and moves a small step along that direction each frame.",
    },
    {
      q: "What is a shockwave in this simulation?",
      a: "A circular force that expands outward from the click point, pushing any balloon inside its radius away from the center.",
    },
    {
      q: "Why do balloons slow down as they get close to the cursor instead of shooting past it?",
      a: "The drift force is proportional to the remaining distance, so movement decelerates as the gap closes.",
    },
  ],
});
