import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "fourier-epicycles",
  title: "Fourier Epicycles",
  description:
    "Spinning circles stacked on each other. The tip of the last one draws any shape you want.",
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
  builtAt: "2026-06-05T10:08:06+12:00",
  prereqs: ["lissajous"],
  understandWhen:
    "You can explain what removing the smallest circles does to the drawn path and why more circles add detail.",
  predictPrompt: "If you keep only the largest circle, what shape does the tip draw?",
});
