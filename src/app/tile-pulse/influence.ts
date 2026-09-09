/**
 * Pure helpers for Tile Pulse: distance falloff and easing functions used both
 * in the canvas draw loop and in unit tests.
 */

/**
 * Smooth cubic falloff from 1 at the centre to 0 at and beyond `radius`.
 * Returns a value in [0, 1]. Uses a cubic ease-out curve so influence drops
 * off quickly near the edge but stays strong at the core.
 *
 * @param dist - distance from the influence source (>= 0)
 * @param radius - maximum radius of influence (> 0)
 * @returns influence strength in [0, 1]
 */
export function radialFalloff(dist: number, radius: number): number {
  if (radius <= 0) return 0;
  if (dist >= radius) return 0;
  // Clamp so the result stays within [0, 1] even for negative dist.
  const t = Math.min(1, Math.max(0, 1 - dist / radius));
  return t * t * t;
}

/**
 * Ease-in-out cubic: accelerates in, decelerates out.
 * Useful for the base looping wave offset on each tile.
 *
 * @param t - input in [0, 1]
 * @returns eased output in [0, 1]
 */
export function easeInOutCubic(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/**
 * Ease-out cubic: starts fast, decelerates to zero.
 * Used for ripple fade-out.
 *
 * @param t - input in [0, 1]
 * @returns eased output in [0, 1]
 */
export function easeOutCubic(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - Math.pow(1 - c, 3);
}

/**
 * Computes the extra influence a ripple exerts on a tile at distance `dist`
 * from the ripple origin, given the current ripple radius and ring width.
 * The ring sweeps outward; tiles on the wavefront get full strength.
 *
 * @param dist - distance from ripple origin to tile centre
 * @param rippleRadius - current outer radius of the ripple ring
 * @param ringWidth - thickness of the ripple ring in pixels
 * @returns influence in [0, 1]
 */
export function rippleInfluence(dist: number, rippleRadius: number, ringWidth: number): number {
  if (ringWidth <= 0) return 0;
  const inner = rippleRadius - ringWidth;
  if (dist < inner || dist > rippleRadius) return 0;
  const t = (dist - inner) / ringWidth;
  // bell curve: 0 at edges, 1 at centre of the ring
  const bell = 1 - Math.abs(t * 2 - 1);
  return bell * bell;
}
