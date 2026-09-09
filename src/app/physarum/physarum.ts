/**
 * Pure Physarum (slime-mold) simulation logic.
 * No DOM imports — safe to run in any environment (browser, Node, Vitest).
 *
 * The model follows Jeff Jones (2010): agents sense three points ahead,
 * turn toward the strongest trail, move forward, and deposit. The shared
 * trail map diffuses and decays each step.
 *
 * Reference: Jones, J. (2010). "Characteristics of Pattern Formation and
 * Evolution in Approximations of Physarum Transport Networks."
 * Artificial Life 16(2): 127–153.
 */

import { TAU } from "@/lib/creative/math";

/** Width and height of the simulation trail grid. */
export type GridSize = { w: number; h: number };

/** A single Physarum agent. */
export type Agent = {
  x: number;
  y: number;
  heading: number;
};

/** Wraps a grid index with toroidal boundary. */
export function trailIndex(x: number, y: number, w: number, h: number): number {
  const gx = ((Math.round(x) % w) + w) % w;
  const gy = ((Math.round(y) % h) + h) % h;
  return gy * w + gx;
}

/**
 * Samples the trail map at a point offset from an agent's position by
 * `dist` at `angle` (absolute). Returns the trail value at that cell.
 */
export function senseDirection(
  trail: Float32Array,
  ax: number,
  ay: number,
  angle: number,
  senseDist: number,
  w: number,
  h: number,
): number {
  const sx = ax + Math.cos(angle) * senseDist;
  const sy = ay + Math.sin(angle) * senseDist;
  return trail[trailIndex(sx, sy, w, h)] ?? 0;
}

/**
 * Advances all agents by one step: sense three points ahead (left, center,
 * right), turn toward the strongest, move, wrap at edges, and deposit.
 *
 * @param agents - Agent array, mutated in place
 * @param trail - Trail map, mutated in place (deposit)
 * @param w - Grid width
 * @param h - Grid height
 * @param senseAngle - Angular separation between L/C/R sensors (radians)
 * @param senseDist - Distance in grid cells from agent to sensor
 * @param turnAngle - How far the agent rotates each step (radians)
 * @param stepSize - How far the agent moves each step (cells)
 * @param depositAmount - Trail deposited per step
 */
export function stepAgents(
  agents: Agent[],
  trail: Float32Array,
  w: number,
  h: number,
  senseAngle: number,
  senseDist: number,
  turnAngle: number,
  stepSize: number,
  depositAmount: number,
): void {
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    if (!agent) continue;

    const { x, y, heading } = agent;

    const fwd = senseDirection(trail, x, y, heading, senseDist, w, h);
    const left = senseDirection(trail, x, y, heading - senseAngle, senseDist, w, h);
    const right = senseDirection(trail, x, y, heading + senseAngle, senseDist, w, h);

    let newHeading = heading;
    if (fwd >= left && fwd >= right) {
      // Continue straight — do nothing.
    } else if (left > right) {
      newHeading = heading - turnAngle;
    } else if (right > left) {
      newHeading = heading + turnAngle;
    } else {
      // Tied left/right: keep heading.
    }

    const nx = x + Math.cos(newHeading) * stepSize;
    const ny = y + Math.sin(newHeading) * stepSize;

    const wx = ((nx % w) + w) % w;
    const wy = ((ny % h) + h) % h;

    agent.x = wx;
    agent.y = wy;
    agent.heading = ((newHeading % TAU) + TAU) % TAU;

    const idx = trailIndex(wx, wy, w, h);
    trail[idx] = Math.min(1, (trail[idx] ?? 0) + depositAmount);
  }
}

/**
 * Applies a simple box-blur diffusion followed by a uniform decay to the
 * trail map. Blurs in-place using a temp buffer.
 *
 * @param trail - Trail map (mutated in place)
 * @param temp - Scratch buffer of same length (mutated)
 * @param w - Grid width
 * @param h - Grid height
 * @param decayRate - Multiplier applied after diffusion (e.g. 0.96)
 */
export function diffuseAndDecay(
  trail: Float32Array,
  temp: Float32Array,
  w: number,
  h: number,
  decayRate: number,
): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const xL = (x - 1 + w) % w;
      const xR = (x + 1) % w;
      const yU = (y - 1 + h) % h;
      const yD = (y + 1) % h;

      const center = trail[y * w + x] ?? 0;
      const top = trail[yU * w + x] ?? 0;
      const bot = trail[yD * w + x] ?? 0;
      const left = trail[y * w + xL] ?? 0;
      const right = trail[y * w + xR] ?? 0;
      const tl = trail[yU * w + xL] ?? 0;
      const tr = trail[yU * w + xR] ?? 0;
      const bl = trail[yD * w + xL] ?? 0;
      const br = trail[yD * w + xR] ?? 0;

      // Weighted kernel: center = 4, cardinal neighbours = 2, corners = 1 (sum = 16).
      // Heavier centre weight keeps filaments crisp instead of smearing them.
      const avg = (center * 4 + (top + bot + left + right) * 2 + tl + tr + bl + br) / 16;

      temp[y * w + x] = avg * decayRate;
    }
  }
  trail.set(temp);
}

/**
 * Injects additional trail into all cells that are lit in the given pixel
 * mask. The mask is an ImageData-style Uint8ClampedArray (RGBA) at the
 * same dimensions as the trail grid (w x h). A cell is "in the mask" when
 * its alpha channel value is above the threshold.
 *
 * @param trail - Trail map (mutated in place)
 * @param mask - RGBA Uint8ClampedArray of length w * h * 4
 * @param w - Grid width
 * @param h - Grid height
 * @param injectAmount - Amount added each step to masked cells
 * @param alphaThreshold - Minimum alpha (0–255) to count as masked
 */
export function injectMask(
  trail: Float32Array,
  mask: Uint8ClampedArray,
  w: number,
  h: number,
  injectAmount: number,
  alphaThreshold = 128,
): void {
  for (let i = 0; i < w * h; i++) {
    const alpha = mask[i * 4 + 3] ?? 0;
    if (alpha > alphaThreshold) {
      trail[i] = Math.min(1, (trail[i] ?? 0) + injectAmount);
    }
  }
}
