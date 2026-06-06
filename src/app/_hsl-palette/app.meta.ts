import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "hsl-palette",
  title: "HSL Palette",
  description: "An interactive HSL color palette generator with classic harmony schemes.",
  library: "plain TS",
  concepts: ["color", "palette"],
  level: 1,
  technique: "HSL harmony math + click-to-copy swatches",
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T07:50:36+12:00",
  prereqs: [],
  understandWhen:
    "You can predict which hue values produce complementary or triadic pairs without running the tool.",
  predictPrompt:
    "If you rotate the base hue by 180 degrees, which harmony scheme does the result match?",
});
