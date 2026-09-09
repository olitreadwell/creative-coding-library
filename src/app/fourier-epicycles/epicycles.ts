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

/** Available target waveforms for the Fourier approximation. */
export type WaveformType = "square" | "sawtooth" | "triangle";

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
 * Builds Fourier terms for a square wave using N odd harmonics.
 *
 * Series: f(t) = (4/pi) * sum_{k=0}^{N-1} sin((2k+1)*TAU*t) / (2k+1)
 *
 * Phase -pi/2 rotates the sine-based series so t=0 starts on the x-axis.
 */
function buildSquareWaveTerms(n: number): Term[] {
  const terms: Term[] = [];
  for (let k = 0; k < n; k++) {
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
 * Builds Fourier terms for a sawtooth wave using N harmonics.
 *
 * Series: f(t) = (2/pi) * sum_{k=1}^{N} (-1)^(k+1) * sin(k*TAU*t) / k
 *
 * Phase -pi/2 aligns the start of the trace with the x-axis.
 */
function buildSawtoothWaveTerms(n: number): Term[] {
  const terms: Term[] = [];
  for (let k = 1; k <= n; k++) {
    const sign = k % 2 === 1 ? 1 : -1;
    terms.push({
      freq: k,
      amp: (2 / Math.PI) * (1 / k),
      phase: sign > 0 ? -Math.PI / 2 : Math.PI / 2,
    });
  }
  // Sort largest amplitude first so the chain is visually stable.
  terms.sort((a, b) => b.amp - a.amp);
  return terms;
}

/**
 * Builds Fourier terms for a triangle wave using N odd harmonics.
 *
 * Series: f(t) = (8/pi^2) * sum_{k=0}^{N-1} (-1)^k * sin((2k+1)*TAU*t) / (2k+1)^2
 */
function buildTriangleWaveTerms(n: number): Term[] {
  const terms: Term[] = [];
  for (let k = 0; k < n; k++) {
    const harmonic = 2 * k + 1; // 1, 3, 5, ...
    const sign = k % 2 === 0 ? 1 : -1;
    terms.push({
      freq: harmonic,
      amp: (8 / (Math.PI * Math.PI)) * (1 / (harmonic * harmonic)),
      phase: sign > 0 ? -Math.PI / 2 : Math.PI / 2,
    });
  }
  return terms;
}

/**
 * Builds Fourier terms for the given waveform with the requested number of harmonics.
 *
 * Square and triangle waves use only odd harmonics; the `harmonics` value is
 * the count of those odd terms (so 8 terms = harmonics 1, 3, 5, …, 15).
 * Sawtooth uses all integer harmonics up to `harmonics`.
 */
export function buildWaveTerms(waveform: WaveformType, harmonics: number): readonly Term[] {
  const n = Math.max(1, Math.floor(harmonics));
  switch (waveform) {
    case "square":
      return buildSquareWaveTerms(n);
    case "sawtooth":
      return buildSawtoothWaveTerms(n);
    case "triangle":
      return buildTriangleWaveTerms(n);
  }
}

/** Default harmonic count matching the original sketch. */
export const DEFAULT_HARMONICS = 8;

/**
 * A fixed set of Fourier terms that approximates a square wave.
 *
 * Eight odd harmonics (1, 3, 5, … 15) are included. Exported for
 * backwards compatibility; prefer `buildWaveTerms` for new code.
 */
export const SQUARE_WAVE_TERMS: readonly Term[] = buildSquareWaveTerms(DEFAULT_HARMONICS);

/** Convenience: the maximum possible radius (sum of all amplitudes). */
export function totalAmplitude(terms: readonly Term[]): number {
  return terms.reduce((sum, t) => sum + t.amp, 0);
}
