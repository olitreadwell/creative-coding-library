import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "mondrian",
  title: "Mondrian",
  description:
    "Colored panels fall toward you in an endless tunnel. All 3D depth is faked with math on a flat canvas.",
  library: "Canvas 2D",
  concepts: ["recursion", "generative", "animation", "perspective", "depth-of-field"],
  level: 2,
  technique: "perspective projection + recursive subdivision + depth-of-field alpha on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["lsystem-tree", "wireframe"],
  understandWhen:
    "You can trace how perspective scaling and recursive splitting work together to create the tunnel illusion.",
  predictPrompt:
    "If panels stop shrinking with distance and stay the same size, what does the tunnel look like?",
});
