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
  prereqs: ["mic-spectrum", "r3f-spheres"],
  understandWhen:
    "You can explain what vertex displacement does in 3D and predict which frequency bands affect which part of the sphere surface.",
  predictPrompt:
    "If you sing a high note, does the top of the sphere, the equator, or the whole surface spike, and why?",
});
