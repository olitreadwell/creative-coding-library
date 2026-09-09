import type { Rng } from "@/lib/creative/random";
import { degToRad } from "@/lib/creative/math";

/**
 * Expand an L-system axiom by applying substitution rules `iterations` times.
 *
 * @param axiom - The starting string (e.g. "X")
 * @param rules - Map from symbol to replacement string (e.g. { F: "FF" })
 * @param iterations - How many rounds of expansion to run (clamped to >= 0)
 * @returns The fully expanded string
 */
export function expand(axiom: string, rules: Record<string, string>, iterations: number): string {
  let current = axiom;
  const steps = Math.max(0, Math.floor(iterations));
  for (let i = 0; i < steps; i++) {
    let next = "";
    for (let c = 0; c < current.length; c++) {
      const ch = current[c] ?? "";
      next += Object.prototype.hasOwnProperty.call(rules, ch) ? (rules[ch] ?? ch) : ch;
    }
    current = next;
  }
  return current;
}

export type Segment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Nesting depth at the time of drawing (0 = trunk, higher = tips) */
  depth: number;
};

export type TurtleConfig = {
  /** Starting X position */
  startX: number;
  /** Starting Y position */
  startY: number;
  /** Initial heading in radians (0 = right, -PI/2 = up) */
  startAngle: number;
  /** Step length in pixels */
  stepLen: number;
  /** Turn angle in degrees */
  turnDeg: number;
  /**
   * Optional seeded PRNG for per-branch angle jitter.
   * Pass null for fully deterministic output.
   */
  rng: Rng | null;
  /** Max jitter in degrees applied per F step */
  jitterDeg: number;
};

/**
 * Walk a turtle through an L-system command string and collect line segments.
 * Supports: F (draw forward), f (move without drawing),
 * + (turn left), - (turn right), [ (push state), ] (pop state).
 *
 * @param commands - The expanded L-system string
 * @param config   - Turtle starting pose and draw parameters
 * @returns Array of {x1,y1,x2,y2,depth} segments
 */
export function turtleSegments(commands: string, config: TurtleConfig): Segment[] {
  const { startX, startY, startAngle, stepLen, turnDeg, rng, jitterDeg } = config;

  const turnRad = degToRad(turnDeg);
  const jitterRad = degToRad(jitterDeg);

  type TurtleState = { x: number; y: number; angle: number; depth: number };
  const stack: TurtleState[] = [];
  const segments: Segment[] = [];

  let x = startX;
  let y = startY;
  let angle = startAngle;
  let depth = 0;

  for (let i = 0; i < commands.length; i++) {
    const ch = commands[i] ?? "";
    switch (ch) {
      case "F": {
        const jitter = rng !== null ? (rng() - 0.5) * 2 * jitterRad : 0;
        const a = angle + jitter;
        const nx = x + Math.cos(a) * stepLen;
        const ny = y + Math.sin(a) * stepLen;
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, depth });
        x = nx;
        y = ny;
        break;
      }
      case "f": {
        const jitter = rng !== null ? (rng() - 0.5) * 2 * jitterRad : 0;
        const a = angle + jitter;
        x += Math.cos(a) * stepLen;
        y += Math.sin(a) * stepLen;
        break;
      }
      case "+":
        angle -= turnRad;
        break;
      case "-":
        angle += turnRad;
        break;
      case "[":
        stack.push({ x, y, angle, depth });
        depth++;
        break;
      case "]": {
        const state = stack.pop();
        if (state !== undefined) {
          x = state.x;
          y = state.y;
          angle = state.angle;
          depth = state.depth;
        }
        break;
      }
      default:
        break;
    }
  }

  return segments;
}
