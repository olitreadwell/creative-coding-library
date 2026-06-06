import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "gsap-stagger",
  title: "Stagger Grid",
  description: "A grid that animates in a staggered wave from the center.",
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
  builtAt: "2026-06-05",
  prereqs: [],
  understandWhen:
    "You can predict the animation order for any starting cell and explain what the stagger amount controls.",
  predictPrompt:
    "If you change the stagger origin from center to top-left, how does the wave pattern change?",
});
