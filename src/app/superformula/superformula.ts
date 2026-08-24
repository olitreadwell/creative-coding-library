export type SuperformulaParams = {
  m: number;
  n1: number;
  n2: number;
  n3: number;
  a: number;
  b: number;
};

/**
 * Gielis superformula: returns the polar radius r at angle theta.
 *
 * r = ( |cos(m*theta/4) / a|^n2 + |sin(m*theta/4) / b|^n3 )^(-1/n1)
 *
 * When n1 is near zero the result would explode; we clamp it away from zero
 * to keep r finite. When the bracket sum is zero we return 0.
 */
export function superRadius(theta: number, params: SuperformulaParams): number {
  const { m, n1, n2, n3, a, b } = params;
  const angle = (m * theta) / 4;
  const termA = Math.pow(Math.abs(Math.cos(angle) / a), n2);
  const termB = Math.pow(Math.abs(Math.sin(angle) / b), n3);
  const sum = termA + termB;
  if (sum === 0) return 0;
  const safeN1 = n1 === 0 ? 1e-6 : n1;
  return Math.pow(sum, -1 / safeN1);
}
