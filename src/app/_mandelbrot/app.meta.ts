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
  recallChecks: [
    {
      q: "What does the escape count measure in the Mandelbrot iteration?",
      a: "It counts how many iterations z = z² + c takes before the magnitude of z exceeds the escape radius (typically 2). Points that never escape are inside the set; points that escape quickly are far outside.",
    },
    {
      q: "How does smooth coloring remove the banding you get from a raw escape count?",
      a: "Smooth coloring adds a fractional offset derived from the final magnitude, so the color varies continuously rather than jumping in integer steps at each iteration boundary.",
    },
    {
      q: "Why is zooming into the Mandelbrot boundary interesting rather than the interior?",
      a: "Interior points all escape at the same answer (never), so they map to the same color. The boundary is where escape time varies wildly, producing the self-similar detail that changes with every zoom.",
    },
  ],
});
