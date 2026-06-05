import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "lsystem-tree",
  title: "L-System Tree",
  description: "A fractal plant grown from an L-system with turtle graphics.",
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
  builtAt: "2026-06-05",
});
