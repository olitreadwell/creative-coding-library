import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "chladni",
  title: "Chladni Figures",
  description:
    "Two waves on a plate cancel in lines. Those lines are where sand would collect in real life.",
  library: "Canvas 2D",
  concepts: ["trigonometry", "waves", "superposition", "field"],
  level: 2,
  technique: "sum of two standing-wave modes, nodal lines via ImageData",
  source: {
    author: "Ernst Chladni",
    title: "Chladni figures",
    url: "https://en.wikipedia.org/wiki/Ernst_Chladni",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-06T11:23:11+12:00",
  prereqs: ["lissajous"],
  understandWhen:
    "You can predict where the still lines appear when the two frequencies are equal versus different.",
  predictPrompt: "If both frequencies are the same number, what shape do the still lines form?",
  recallChecks: [
    {
      q: "What do the bright lines on a Chladni figure represent physically?",
      a: "The nodal lines: points on the plate that do not move when it vibrates. In real life, sand collects there.",
    },
    {
      q: "How is the overall Chladni pattern produced from two waves?",
      a: "Two standing-wave sine patterns are added together (superposition). The result is their sum evaluated at every pixel.",
    },
    {
      q: "What happens when you increase the mode parameter by one integer?",
      a: "The number of segments in the pattern increases and the figure reorganizes into a new shape.",
    },
  ],
});
