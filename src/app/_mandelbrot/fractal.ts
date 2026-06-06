/**
 * Pure Mandelbrot math. No DOM imports — safe to run in any environment.
 */

/** Maximum iterations used as a sentinel meaning "in the set". */
const DEFAULT_MAX_ITER = 256;

export type View = {
  centerX: number;
  centerY: number;
  /** Full width of the complex-plane window (not radius). */
  span: number;
};

/**
 * Computes a smooth (continuous) escape-time value for the point (cx, cy).
 *
 * Returns `maxIter` when the orbit stays bounded (point is in the set).
 * Otherwise returns a fractional iteration count via the "log-log" smooth
 * coloring method, which removes discrete banding from integer counts.
 *
 * @param cx - Real part of the complex constant c
 * @param cy - Imaginary part of the complex constant c
 * @param maxIter - Iteration ceiling; also returned when the point is in the set
 * @returns Smooth escape count in [0, maxIter]
 */
export function mandelEscape(cx: number, cy: number, maxIter: number = DEFAULT_MAX_ITER): number {
  let zx = 0;
  let zy = 0;
  let iter = 0;

  while (iter < maxIter) {
    const zx2 = zx * zx;
    const zy2 = zy * zy;
    if (zx2 + zy2 > 4) {
      // Smooth coloring: subtract log(log(|z|)) / log(2) to remove banding.
      const logZabs = Math.log(zx2 + zy2) / 2;
      const nu = Math.log(logZabs / Math.LN2) / Math.LN2;
      return iter + 1 - nu;
    }
    zy = 2 * zx * zy + cy;
    zx = zx2 - zy2 + cx;
    iter++;
  }

  return maxIter;
}

/**
 * Maps a canvas pixel coordinate to a complex-plane coordinate.
 *
 * The view `span` is the full height of the complex-plane window. The width
 * is scaled by the aspect ratio so the set is never distorted.
 *
 * @param px - Pixel x (0-based, left to right)
 * @param py - Pixel y (0-based, top to bottom)
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @param view - Current complex-plane viewport
 * @returns Complex number { x: real, y: imaginary }
 */
export function pixelToComplex(
  px: number,
  py: number,
  width: number,
  height: number,
  view: View,
): { x: number; y: number } {
  const aspectRatio = width / height;
  // Map x: [0, width] → [centerX - span/2 * ar, centerX + span/2 * ar]
  const x = view.centerX + (px / width - 0.5) * view.span * aspectRatio;
  // Map y: [0, height] → [centerY + span/2, centerY - span/2] (canvas y-down)
  const y = view.centerY - (py / height - 0.5) * view.span;
  return { x, y };
}
