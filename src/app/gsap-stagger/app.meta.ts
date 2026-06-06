import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "gsap-stagger",
  title: "Stagger Grid",
  description:
    "Tiles animate one after another in a wave. Teaches stagger: how to delay each item in a sequence.",
  library: "GSAP",
  concepts: ["animation", "easing", "stagger"],
  level: 1,
  technique: "GSAP timeline + grid stagger",
  source: {
    author: "GreenSock",
    title: "GSAP stagger docs",
    url: "https://gsap.com/docs/v3/Staggers/",
    license: "docs",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T07:50:36+12:00",
  prereqs: [],
  understandWhen:
    "You can predict which tile animates first and explain what the stagger delay amount controls.",
  predictPrompt:
    "If you move the wave origin from center to top-left, how does the tile order change?",
});
