import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "hsl-palette",
  title: "HSL Palette",
  description:
    "Pick a color and see matching palettes: complementary, triadic, and more. Click to copy any swatch.",
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
    "You can predict the hue values for a complementary or triadic pair without opening the tool.",
  predictPrompt:
    "If you shift the base hue by 180 degrees, which harmony scheme does the new palette match?",
});
