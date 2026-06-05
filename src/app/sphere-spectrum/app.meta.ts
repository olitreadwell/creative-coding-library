import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "sphere-spectrum",
  title: "Sphere Spectrum",
  description:
    "A sphere whose surface erupts into colored peaks driven by your microphone, with log-frequency banding.",
  library: "React Three Fiber + Web Audio",
  concepts: ["audio-reactive", "3d", "vertex-displacement", "microphone"],
  level: 3,
  technique: "per-vertex displacement of an icosphere by a log-banded Web Audio FFT",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
