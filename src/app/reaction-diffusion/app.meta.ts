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
  recallChecks: [
    {
      q: "What do the two chemicals in the Gray-Scott model represent?",
      a: "Chemical A is an activator that spreads and promotes its own growth. Chemical B is an inhibitor that consumes A. Their interaction creates the pattern.",
    },
    {
      q: "What does the feed rate control?",
      a: "How quickly chemical A is added to the system. A low feed rate starves the pattern; a high rate floods it.",
    },
    {
      q: "Why does the same rule produce spots in one region and stripes in another?",
      a: "Different feed and kill rate combinations push the system into different stable configurations. Spots and stripes are each a distinct equilibrium.",
    },
  ],
});
