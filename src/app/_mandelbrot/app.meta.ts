import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "mandelbrot",
  title: "Mandelbrot",
  description: "An escape-time Mandelbrot set you can click to zoom into.",
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
  builtAt: "2026-06-05",
  prereqs: ["hsl-palette"],
  understandWhen:
    "You can explain what the escape count measures and predict how changing max iterations affects boundary detail.",
  predictPrompt:
    "If you double the max iteration count, what changes: the colors inside the set, the colors outside, or the sharpness of the boundary?",
});
