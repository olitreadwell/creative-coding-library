import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "sphere-spectrum",
  title: "Sphere Spectrum",
  description:
    "A 3D sphere that spikes outward in response to your mic. Each spike maps to a frequency band from your audio.",
  library: "React Three Fiber + Web Audio",
  concepts: ["audio-reactive", "3d", "vertex-displacement", "microphone"],
  level: 3,
  technique: "per-vertex displacement of an icosphere by a log-banded Web Audio FFT",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T18:23:05+12:00",
  prereqs: ["mic-spectrum", "r3f-spheres"],
  understandWhen:
    "You can explain what vertex displacement is and predict which part of the sphere spikes for a low note versus a high one.",
  predictPrompt:
    "If you sing a high note, does the top, equator, or whole surface of the sphere spike?",
});
