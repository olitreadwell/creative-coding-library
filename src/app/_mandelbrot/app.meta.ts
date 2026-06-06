import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "mandelbrot",
  title: "Mandelbrot",
  description:
    "A fractal you can zoom into forever. Each click reveals new detail at the boundary.",
  library: "Canvas 2D",
  concepts: ["fractal", "complex-numbers", "color"],
  level: 2,
  technique: "escape-time iteration + smooth coloring",
  source: {
    author: "Benoit Mandelbrot",
    title: "Mandelbrot set",
    url: "https://en.wikipedia.org/wiki/Mandelbrot_set",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T08:44:33+12:00",
  prereqs: ["hsl-palette"],
  understandWhen:
    "You can explain what the escape count measures and predict how boundary detail changes when you raise max iterations.",
  predictPrompt:
    "If you double the max iteration count, what changes: colors inside the set, colors outside, or the sharpness of the edge?",
});
