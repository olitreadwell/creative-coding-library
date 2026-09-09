import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "physarum",
  title: "Physarum Letters",
  description:
    "Tiny agents follow and leave trails, forming words out of slime-mold paths. Each environment changes the texture.",
  library: "Canvas 2D",
  concepts: ["agents", "simulation", "generative"],
  level: 3,
  technique: "Physarum agent simulation with a text mask on Canvas 2D",
  source: {
    author: "Sage Jenson / Jeff Jones",
    title: "Physarum",
    url: "https://cargocollective.com/sagejenson/physarum",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["boids", "reaction-diffusion"],
  understandWhen:
    "You can describe the sense-turn-move-deposit loop each agent follows and predict what a wider sensor angle does to the trails.",
  predictPrompt:
    "If you widen the sensor angle, do the trails get broader, thinner, or more tangled?",
  recallChecks: [
    {
      q: "What three things does each agent do on every step?",
      a: "It senses the trail ahead at two angled positions, turns toward the stronger signal, moves forward, and deposits a little trail behind it.",
    },
    {
      q: "Why do the trails form thick ropes instead of spreading out uniformly?",
      a: "Agents follow each other's deposits, so paths reinforce themselves. Stronger trails attract more agents, which make the trail even stronger.",
    },
    {
      q: "What does the text mask add to the simulation?",
      a: "It restricts where agents can deposit, so the slime-mold growth is confined to the letter shapes and the words emerge from the agent behavior.",
    },
  ],
});
