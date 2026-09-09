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
  recallChecks: [
    {
      q: "What do the three HSL values each control?",
      a: "Hue (0 to 360 degrees) sets the color name. Saturation sets how vivid the color is. Lightness sets how dark or bright it appears.",
    },
    {
      q: "How does adding a fixed offset to a hue produce a color harmony?",
      a: "Hue is circular (0 = 360), so fixed offsets like 180 (complementary) or 120 (triadic) always land on predictable relationships on the color wheel.",
    },
    {
      q: "How does this tool decide whether to show black or white text on a swatch?",
      a: "If lightness is above 55% it uses black text; below 55% it uses white text. Saturation and hue are not considered.",
    },
  ],
});
