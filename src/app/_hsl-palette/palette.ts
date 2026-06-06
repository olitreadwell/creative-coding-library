import { hsl, shift } from "@/lib/creative/color";
import type { Hsl } from "@/lib/creative/color";

export type Scheme = "complementary" | "analogous" | "triadic" | "tetradic" | "monochromatic";

const LIGHTNESS_TEXT_THRESHOLD = 0.55;

const MONO_LIGHTNESS_STEPS = [0.15, 0.3, 0.45, 0.6, 0.75];

const HUE_OFFSETS: Record<Scheme, number[]> = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  monochromatic: [0, 0, 0, 0, 0],
};

export function generatePalette(base: Hsl, scheme: Scheme): Hsl[] {
  if (scheme === "monochromatic") {
    return MONO_LIGHTNESS_STEPS.map((l) => hsl(base.h, base.s, l));
  }

  const offsets = HUE_OFFSETS[scheme];
  return offsets.map((dh) => shift(base, dh, 0, 0));
}

export function readableText(c: Hsl): "#000000" | "#ffffff" {
  return c.l >= LIGHTNESS_TEXT_THRESHOLD ? "#000000" : "#ffffff";
}
