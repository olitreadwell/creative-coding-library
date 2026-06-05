import { clamp } from "@/lib/creative/math";

/**
 * Maps a brightness value [0, 1] to a glyph index in a sorted array of length
 * `count`. 0 = densest glyph (darkest cell), count-1 = sparsest glyph (lightest
 * cell). The mapping inverts brightness so dark areas get dense characters.
 */
export function brightnessToIndex(brightness: number, count: number): number {
  if (count <= 0) return 0;
  const b = clamp(brightness, 0, 1);
  const inverted = 1 - b;
  const raw = Math.round(inverted * (count - 1));
  return clamp(raw, 0, count - 1);
}
