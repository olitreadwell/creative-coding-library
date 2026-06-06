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
  prereqs: ["noise-field"],
  understandWhen:
    "You can explain what each frequency bin in the FFT output represents and predict which bins spike for a low hum versus a whistle.",
  predictPrompt:
    "If you hum and then whistle, which end of the spectrum bar chart lights up for each sound?",
});
