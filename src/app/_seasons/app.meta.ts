import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "seasons",
  title: "Seasons",
  description:
    "Ribbons drift across the screen. Their colors blend from one season palette to the next over time.",
  library: "Canvas 2D",
  concepts: ["color", "generative", "interaction"],
  level: 1,
  technique: "flow-curve ribbons with season palette interpolation on Canvas 2D",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T16:58:41+12:00",
  prereqs: ["hsl-palette"],
  understandWhen:
    "You can describe how blending between two color palettes produces a smooth transition and predict the midpoint colors.",
  predictPrompt:
    "If you remove the blend step and snap directly between palettes, what does the transition look like?",
  recallChecks: [
    {
      q: "How does palette interpolation produce the colors between two seasons?",
      a: "Each color channel (or hue, saturation, lightness) is linearly interpolated between the source palette and the target palette using a blend factor that moves from 0 to 1 over time. At 0.5 the result is an even mix of both palettes.",
    },
    {
      q: "What makes ribbons look like they are flowing rather than teleporting across the screen?",
      a: "Each ribbon stores a list of past positions. Each frame, a new position is appended and the oldest is dropped, so the ribbon is drawn as a curve through recent history rather than a single moving point.",
    },
    {
      q: "Why does increasing the number of ribbons make the sketch feel denser but not necessarily faster?",
      a: "More ribbons means more curve segments drawn per frame. The Canvas 2D draw cost scales with the number of paths, so frame time grows with ribbon count even though no physics changes.",
    },
  ],
});
