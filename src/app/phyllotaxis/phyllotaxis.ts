// The golden angle in degrees: 360 * (1 - 1/phi). Placing each successive seed
// at this angle around the center is what produces the interlocking spirals of
// sunflowers, pinecones, and pineapples.
export const GOLDEN_ANGLE_DEG = 137.50776405003785;

export type Seed = { x: number; y: number };

/**
 * Position of the i-th seed in a phyllotactic pattern. Each seed is rotated by
 * `angleRad` from the previous one and pushed out by sqrt(i), so the seeds pack
 * at an even density (Vogel's model).
 */
export function seedPosition(i: number, angleRad: number, scale: number): Seed {
  const a = i * angleRad;
  const r = scale * Math.sqrt(i);
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}
