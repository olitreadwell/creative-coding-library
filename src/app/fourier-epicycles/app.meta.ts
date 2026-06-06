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
  recallChecks: [
    {
      q: "What do the size and speed of each circle in the chain represent?",
      a: "Size is the amplitude (how much that term contributes to the shape). Speed is the frequency (how many rotations per cycle).",
    },
    {
      q: "Why does adding more circles make the traced path look more like the target shape?",
      a: "Each added circle corrects the remaining error. More terms means the approximation converges closer to the target (Fourier convergence).",
    },
    {
      q: "What makes the path a parametric curve rather than a standard y = f(x) curve?",
      a: "Both x and y are computed from a shared parameter t. There is no single equation relating x and y directly.",
    },
  ],
});
