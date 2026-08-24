import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "squish",
  title: "Squish",
  description:
    "Grab and fling soft blobs. Each blob is a ring of points held together by springs and internal pressure.",
  library: "Canvas 2D",
  concepts: ["physics", "simulation", "interaction"],
  level: 3,
  technique: "Verlet soft bodies with spring constraints and pressure on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["physics-drops", "metaballs"],
  understandWhen:
    "You can explain how Verlet integration differs from Euler integration and predict what very high spring stiffness does to the blob.",
  predictPrompt:
    "If you crank spring stiffness to its max, does the blob become rigid, jiggle harder, or fall apart?",
  recallChecks: [
    {
      q: "How does Verlet integration differ from Euler integration for particle positions?",
      a: "Verlet integration derives velocity implicitly from the difference between the current and previous position, rather than storing velocity separately. This makes it more numerically stable for spring and constraint systems because position errors don't compound through an explicit velocity variable.",
    },
    {
      q: "What keeps a soft blob from collapsing under spring forces?",
      a: "An internal pressure term models the enclosed area. When the blob is compressed, the area drops below the target and the pressure pushes points outward, opposing collapse the same way air pressure holds a balloon open.",
    },
    {
      q: "What is the role of spring constraints between adjacent points on the blob ring?",
      a: "Each spring connects two neighboring points on the ring and resists changes in the distance between them. Together they keep the perimeter roughly fixed in length, which lets the blob bend and squish without stretching apart.",
    },
  ],
});
