import { clamp } from "@/lib/creative/math";

// Number of perceptual frequency bands the spectrum is grouped into.
export const NUM_BANDS = 24;

/**
 * Geometric (log-frequency) band edges over [1, usableBins]. Returns numBands+1
 * bin boundaries; band k spans bins [edges[k], edges[k+1]). Log spacing keeps
 * bass from dominating, since musical pitch is logarithmic, not linear.
 */
export function logBandEdges(numBands: number, usableBins: number): number[] {
  const lo = 1;
  const hi = Math.max(lo + 1, usableBins);
  const edges: number[] = [];
  for (let k = 0; k <= numBands; k++) {
    edges.push(Math.round(lo * Math.pow(hi / lo, k / numBands)));
  }
  return edges;
}

/** Mean magnitude (0..1) of FFT bytes across the bin range [start, end). */
export function bandLevel(data: Uint8Array, start: number, end: number): number {
  const a = clampInt(start, 0, data.length);
  const b = clampInt(end, a + 1, data.length);
  if (b <= a) return 0;
  let sum = 0;
  for (let i = a; i < b; i++) sum += data[i] ?? 0;
  return sum / ((b - a) * 255);
}

/**
 * Treble compensation: a gentle gain rising from 1 at the lowest band to 1+max
 * at the highest, so quiet high frequencies still register against loud bass.
 */
export function shelfGain(bandIndex: number, numBands: number, max = 1.6): number {
  if (numBands <= 1) return 1;
  return 1 + clamp(bandIndex / (numBands - 1), 0, 1) * max;
}

/**
 * Map a unit-sphere vertex's height to a band index by latitude: the north pole
 * (y = +r) is band 0 (bass), the south pole (y = -r) is the last band (treble),
 * so frequency bands wrap the sphere as rings of latitude.
 */
export function vertexBand(y: number, radius: number, numBands: number): number {
  if (numBands <= 1 || radius <= 0) return 0;
  const theta = Math.acos(clamp(y / radius, -1, 1)); // 0 at north pole, PI at south
  return clamp(Math.floor((theta / Math.PI) * numBands), 0, numBands - 1);
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}
