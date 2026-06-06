import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "strange-attractor",
  title: "Strange Attractor",
  description:
    "Millions of points follow a chaotic rule and settle into a detailed shape. Arrow keys shift the four parameters.",
  library: "Canvas 2D",
  concepts: ["chaos", "attractor", "interaction"],
  level: 2,
  technique: "de Jong attractor iteration with density accumulation on Canvas 2D",
  source: {
    author: "Peter de Jong",
    title: "de Jong attractor",
    url: "https://paulbourke.net/fractals/peterdejong/",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T15:37:57+12:00",
  prereqs: ["noise-field"],
  understandWhen:
    "You can explain why a tiny parameter change can produce a completely different shape in a chaotic system.",
  predictPrompt:
    "If you nudge one parameter by 0.01, does the shape change gradually or jump to something unrelated?",
  recallChecks: [
    {
      q: "What makes a system chaotic?",
      a: "Tiny differences in starting conditions or parameters grow exponentially over time, making long-term behavior unpredictable even though the rule is deterministic.",
    },
    {
      q: "Why does the attractor still look like a recognisable shape even though it is chaotic?",
      a: "Points converge toward the attractor's region of space over many iterations. The shape is the set of positions that the system keeps visiting.",
    },
    {
      q: "What does density accumulation add to the rendering?",
      a: "Pixels that points visit more often get brighter, revealing structure inside the attractor that would be invisible if every point were drawn the same color.",
    },
  ],
});
