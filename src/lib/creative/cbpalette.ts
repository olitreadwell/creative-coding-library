// Colorblind-safe palettes based on the Okabe-Ito set, which is designed to stay
// distinguishable for protanopia, deuteranopia, and tritanopia. We order by
// lightness and split into theme-specific sets so colors keep strong contrast
// against the canvas background. Protanopia (red-blind) is prioritized: hues are
// separated by lightness and by the blue/orange/teal axis rather than red/green.

import { lerp } from "./math";
import { hsl, hslString } from "./color";

/** The full Okabe-Ito categorical palette (8 colors). */
export const OKABE_ITO = [
  "#000000", // black
  "#E69F00", // orange
  "#56B4E9", // sky blue
  "#009E73", // bluish green
  "#F0E442", // yellow
  "#0072B2", // blue
  "#D55E00", // vermillion
  "#CC79A7", // reddish purple
] as const;

/** Bright, high-luminance subset that reads well on a DARK background. */
export const CB_ON_DARK = [
  "#56B4E9", // sky blue
  "#E69F00", // orange
  "#009E73", // green
  "#F0E442", // yellow
  "#CC79A7", // purple
  "#D55E00", // vermillion
] as const;

/** Deeper, lower-luminance subset that reads well on a LIGHT background. */
export const CB_ON_LIGHT = [
  "#0072B2", // blue
  "#D55E00", // vermillion
  "#009E73", // green
  "#CC79A7", // purple
  "#E69F00", // orange
  "#1A1A1A", // near-black
] as const;

export type ThemeName = "light" | "dark";

/** Returns a colorblind-safe palette tuned for the active theme's background. */
export function cbColors(theme: ThemeName | undefined): readonly string[] {
  return theme === "light" ? CB_ON_LIGHT : CB_ON_DARK;
}

/** Picks the i-th colorblind-safe color for the theme, cycling the palette. */
export function cbColor(i: number, theme: ThemeName | undefined): string {
  const palette = cbColors(theme);
  const idx = ((i % palette.length) + palette.length) % palette.length;
  return palette[idx] as string;
}

/**
 * Colorblind-safe SEQUENTIAL ramp for continuous fields (heatmaps, gradients).
 * Runs blue -> teal -> yellow, the protanopia-safe axis, with lightness rising
 * so it also reads in grayscale. `t` is clamped to [0, 1].
 */
export function cbRamp(t: number, theme: ThemeName | undefined): string {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  const hue = lerp(250, 55, x); // blue -> yellow
  const light = theme === "light" ? lerp(0.28, 0.55, x) : lerp(0.32, 0.66, x);
  return hslString(hsl(hue, 0.72, light));
}
