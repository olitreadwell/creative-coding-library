/**
 * Pure Fourier epicycles math. No DOM imports — safe to run in any environment.
 */

import { TAU } from "@/lib/creative/math";

/** A single rotating-vector term in a Fourier series. */
export type Term = {
  /** Angular frequency (rotations per full cycle, may be negative). */
  freq: number;
  /** Amplitude (radius of this circle). */
  amp: number;
  /** Initial phase offset in radians. */
  phase: number;
};

/**
 * Computes the tip position of a chain of epicycles at time `t`.
 *
 * Each term contributes a vector `amp * e^(i*(freq*TAU*t + phase))`.
 * The chain is summed in the order provided. The result is the 2D
 * point where the final arrow-tip lands, relative to the origin.
 *
 * @param terms - Ordered list of Fourier terms (largest amp first recommended)
 * @param t - Normalized time in [0, 1]; at t=0 the drawing starts; at t=1 it closes
 * @returns The {x, y} position of the tip of the last arm
 */
export function epicyclePoint(terms: readonly Term[], t: number): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const term of terms) {
    const angle = term.freq * TAU * t + term.phase;
    x += term.amp * Math.cos(angle);
    y += term.amp * Math.sin(angle);
  }
  return { x, y };
}

/**
 * Returns the tip position of each arm as the chain is accumulated.
 * Index 0 is after the first term, index N-1 is the final tip.
 *
 * @param terms - Ordered list of Fourier terms
 * @param t - Normalized time in [0, 1]
 * @returns Array of { x, y } arm-tip positions, one per term
 */
export function epicycleArms(terms: readonly Term[], t: number): Array<{ x: number; y: number }> {
  const arms: Array<{ x: number; y: number }> = [];
  let x = 0;
  let y = 0;
  for (const term of terms) {
    const angle = term.freq * TAU * t + term.phase;
    x += term.amp * Math.cos(angle);
    y += term.amp * Math.sin(angle);
    arms.push({ x, y });
  }
  return arms;
}

/**
 * A square-wave Fourier series approximation using the first N odd harmonics.
 *
 * The Fourier series for a square wave is:
 *   f(t) = (4/pi) * sum_{k=0}^{N-1} sin((2k+1)*TAU*t) / (2k+1)
 *
 * Visualised as epicycles this shows how stacking faster, smaller circles
 * builds up a shape with sharp corners from pure rotations.
 *
 * Amplitude is scaled so the total fits comfortably in a unit circle;
 * normalise by dividing by the theoretical sum (4/pi).
 */
const SQUARE_WAVE_HARMONICS = 8;

function buildSquareWaveTerms(): Term[] {
  const terms: Term[] = [];
  // Phase -pi/2 rotates the sine-based series so it starts at t=0 on the x-axis,
  // matching the visual convention where the arm begins pointing right.
  for (let k = 0; k < SQUARE_WAVE_HARMONICS; k++) {
    const harmonic = 2 * k + 1; // 1, 3, 5, 7, ...
    terms.push({
      freq: harmonic,
      amp: (4 / Math.PI) * (1 / harmonic),
      phase: -Math.PI / 2,
    });
  }
  return terms;
}

/**
 * A fixed set of Fourier terms that approximates a square wave.
 *
 * Eight odd harmonics (1, 3, 5, … 15) are included. The fundamental
 * circle (freq=1) has the largest radius; each successive harmonic is
 * smaller and spins faster, progressively sharpening the traced shape.
 */
export const SQUARE_WAVE_TERMS: readonly Term[] = buildSquareWaveTerms();

/** Convenience: the maximum possible radius (sum of all amplitudes). */
export function totalAmplitude(terms: readonly Term[]): number {
  return terms.reduce((sum, t) => sum + t.amp, 0);
}
