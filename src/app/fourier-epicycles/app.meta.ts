import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "fourier-epicycles",
  title: "Fourier Epicycles",
  description: "A chain of rotating circles that together trace a shape.",
  library: "Canvas 2D",
  concepts: ["fourier", "epicycles", "trigonometry", "parametric"],
  level: 2,
  technique: "sum of rotating vectors (Fourier terms)",
  source: {
    author: "Joseph Fourier",
    title: "Fourier series",
    url: "https://en.wikipedia.org/wiki/Fourier_series",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
  prereqs: ["lissajous"],
  understandWhen:
    "You can explain what removing the smallest epicycles does to the traced path and why higher terms add detail.",
  predictPrompt:
    "If you keep only the first (largest) epicycle, what shape does the tip trace and why?",
});
