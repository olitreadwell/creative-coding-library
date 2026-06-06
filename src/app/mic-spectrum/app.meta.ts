import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "mic-spectrum",
  title: "Mic Spectrum",
  description: "Your microphone drawn live as a bouncing frequency spectrum.",
  library: "Web Audio + Canvas 2D",
  concepts: ["interaction", "audio", "generative"],
  level: 2,
  technique: "getUserMedia + AnalyserNode FFT on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
