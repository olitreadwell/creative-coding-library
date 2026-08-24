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
  recallChecks: [
    {
      q: "What does the perspective projection formula scale = focal / (focal + z) do?",
      a: "It maps depth z to a scale factor: a small z (close to camera) gives a scale near 1 (large), and a large z (far away) gives a scale near 0 (tiny).",
    },
    {
      q: "How does recursive subdivision produce the Mondrian grid pattern?",
      a: "The subdivide function splits a rectangle either horizontally or vertically, then calls itself on each half, building a tree of smaller rectangles.",
    },
    {
      q: "What does depth of field do to panels that are far from the focus depth?",
      a: "Their alpha (opacity) is reduced, making them fade toward transparent the further they are from the focus plane.",
    },
  ],
});
