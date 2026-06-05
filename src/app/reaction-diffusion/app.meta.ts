import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "reaction-diffusion",
  title: "Reaction Diffusion",
  description: "Two virtual chemicals react and diffuse into living patterns.",
  library: "Canvas 2D",
  concepts: ["reaction-diffusion", "simulation", "generative", "emergence"],
  level: 2,
  technique: "Gray-Scott model on a grid",
  source: {
    author: "Gray & Scott",
    title: "Reaction-diffusion (Gray-Scott)",
    url: "https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
