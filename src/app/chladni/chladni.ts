/**
 * Chladni plate field. `x` and `y` run from 0 to 1 across a square plate.
 * `a` and `b` are the two vibration mode numbers. The value is a superposition
 * of two standing waves; the plate is still (a node) wherever it returns zero,
 * which is where sand would gather on a real vibrating plate.
 */
export function chladni(x: number, y: number, a: number, b: number): number {
  const PI = Math.PI;
  return Math.sin(PI * a * x) * Math.sin(PI * b * y) + Math.sin(PI * b * x) * Math.sin(PI * a * y);
}

/**
 * How close a field value is to a nodal line, as a 0..1 weight. It is 1 exactly
 * on a node (value 0) and falls linearly to 0 once `width` away. Wider values
 * draw thicker, softer lines.
 */
export function nodeIntensity(value: number, width: number): number {
  const t = 1 - Math.abs(value) / width;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
