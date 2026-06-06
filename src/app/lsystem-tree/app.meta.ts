import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "lsystem-tree",
  title: "L-System Tree",
  description:
    "A plant grown from rewrite rules. Each letter maps to a draw command. Add iterations to add branches.",
  library: "Canvas 2D",
  concepts: ["recursion", "l-system", "generative"],
  level: 2,
  technique: "L-system expansion + turtle drawing",
  source: {
    author: "Aristid Lindenmayer",
    title: "L-systems",
    url: "https://en.wikipedia.org/wiki/L-system",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T08:44:33+12:00",
  prereqs: ["shrooms"],
  understandWhen:
    "You can expand a 3-step L-system by hand and predict the sequence of draw commands it produces.",
  predictPrompt: "If you add one more rewrite step, does the tree get taller, wider, or both?",
});
