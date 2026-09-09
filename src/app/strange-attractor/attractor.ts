export type DeJongParams = { a: number; b: number; c: number; d: number };

export const PARAM_MIN = -3;
export const PARAM_MAX = 3;

export const DEFAULT_PARAMS: DeJongParams = { a: 1.641, b: 1.902, c: 0.316, d: 1.525 };

export const PRESETS: ReadonlyArray<{ label: string; params: DeJongParams }> = [
  { label: "classic", params: { a: 1.641, b: 1.902, c: 0.316, d: 1.525 } },
  { label: "web", params: { a: -2.0, b: -2.0, c: -1.2, d: 2.0 } },
  { label: "ribbon", params: { a: 1.4, b: -2.3, c: 2.4, d: -2.1 } },
  { label: "knot", params: { a: 2.01, b: -2.53, c: 1.61, d: -0.33 } },
];

/**
 * One iteration of the Peter de Jong attractor map. From any starting point the
 * sequence of (x, y) settles onto an intricate fixed shape that depends only on
 * the four parameters. Outputs always land within [-2, 2] on each axis because
 * each term is a sum of a sine and a cosine.
 */
export function stepDeJong(x: number, y: number, p: DeJongParams): { x: number; y: number } {
  return {
    x: Math.sin(p.a * y) - Math.cos(p.b * x),
    y: Math.sin(p.c * x) - Math.cos(p.d * y),
  };
}
