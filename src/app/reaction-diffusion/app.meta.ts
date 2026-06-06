import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "reaction-diffusion",
  title: "Reaction Diffusion",
  description:
    "Two chemicals spread and react on a grid. Their interaction produces spots, stripes, and coral-like forms.",
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
  builtAt: "2026-06-05T10:08:06+12:00",
  prereqs: ["conway-life"],
  understandWhen:
    "You can explain what the feed rate and kill rate each do and predict which one to raise to turn spots into stripes.",
  predictPrompt:
    "If you raise the kill rate until it nearly matches the feed rate, does the pattern get sparser, denser, or vanish?",
});
