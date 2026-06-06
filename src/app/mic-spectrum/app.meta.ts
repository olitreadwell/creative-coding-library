import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "mic-spectrum",
  title: "Mic Spectrum",
  description:
    "Your mic split into frequency bars in real time. Low sounds on the left. High sounds on the right.",
  library: "Web Audio + Canvas 2D",
  concepts: ["interaction", "audio", "generative"],
  level: 2,
  technique: "getUserMedia + AnalyserNode FFT on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T14:50:44+12:00",
  prereqs: ["noise-field"],
  understandWhen:
    "You can explain what each bar in the spectrum represents and predict which bars spike for a hum versus a whistle.",
  predictPrompt: "If you hum then whistle, which end of the bar chart lights up for each sound?",
});
