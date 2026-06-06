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
});
