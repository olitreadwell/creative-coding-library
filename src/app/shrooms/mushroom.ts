import { randRange, randInt } from "@/lib/creative/random";
import type { Rng } from "@/lib/creative/random";
import { cbColor } from "@/lib/creative/cbpalette";
import type { ThemeName } from "@/lib/creative/cbpalette";

export type MushroomGeometry = {
  x: number;
  baseY: number;
  stemH: number;
  stemW: number;
  capRx: number;
  capRy: number;
  lean: number;
  colorIdx: number;
  spotCount: number;
  depth: number;
};

/**
 * Returns deterministic mushroom geometry for a given position and RNG state.
 * `depth` is in [0, 1]: 0 = far back (smaller, paler), 1 = front (larger, fuller).
 */
export function makeMushroom(rng: Rng, x: number, baseY: number): MushroomGeometry {
  const depth = rng();
  const scale = 0.4 + depth * 0.6;
  const stemH = randRange(rng, 28, 60) * scale;
  const stemW = randRange(rng, 6, 12) * scale;
  const capRx = randRange(rng, 18, 36) * scale;
  const capRy = randRange(rng, 12, 24) * scale;
  const lean = randRange(rng, -0.18, 0.18);
  const colorIdx = randInt(rng, 0, 6);
  const spotCount = randInt(rng, 2, 7);
  return { x, baseY, stemH, stemW, capRx, capRy, lean, colorIdx, spotCount, depth };
}

export function capColor(m: MushroomGeometry, theme: ThemeName): string {
  return cbColor(m.colorIdx, theme);
}

export function spotColor(theme: ThemeName): string {
  return theme === "dark" ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.70)";
}

export function stemColor(theme: ThemeName): string {
  return theme === "dark" ? "rgba(220,210,190,0.80)" : "rgba(160,140,110,0.90)";
}

/**
 * Scatter `count` mushrooms across the canvas width, sorted back-to-front by depth.
 */
export function scatterMushrooms(
  rng: Rng,
  count: number,
  width: number,
  groundY: number,
): MushroomGeometry[] {
  const list: MushroomGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const x = randRange(rng, 0, width);
    list.push(makeMushroom(rng, x, groundY));
  }
  list.sort((a, b) => a.depth - b.depth);
  return list;
}

/**
 * Draw one mushroom onto `ctx`.
 * `sway` is a small signed offset (pixels) applied to the cap's x position.
 * `alpha` dims far-back mushrooms.
 */
export function drawMushroom(
  ctx: CanvasRenderingContext2D,
  m: MushroomGeometry,
  sway: number,
  theme: ThemeName,
): void {
  const alpha = 0.35 + m.depth * 0.65;
  const capX = m.x + m.lean * m.stemH + sway;
  const capY = m.baseY - m.stemH;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Stem: a slightly tapered rounded rectangle.
  const stemTopW = m.stemW * 0.7;
  const stemBottomW = m.stemW;
  ctx.beginPath();
  ctx.moveTo(m.x - stemTopW / 2 + sway * 0.4, capY + m.capRy * 0.5);
  ctx.lineTo(m.x + stemTopW / 2 + sway * 0.4, capY + m.capRy * 0.5);
  ctx.lineTo(m.x + stemBottomW / 2, m.baseY);
  ctx.lineTo(m.x - stemBottomW / 2, m.baseY);
  ctx.closePath();
  ctx.fillStyle = stemColor(theme);
  ctx.fill();

  // Cap: a filled upper half-ellipse (dome). Counterclockwise from PI to 0 traces
  // the top arc, which is the upward-facing dome in canvas's y-down coordinate system.
  ctx.beginPath();
  ctx.ellipse(capX, capY, m.capRx, m.capRy, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = capColor(m, theme);
  ctx.fill();

  // Spots: small circles on the cap's upper half.
  const sc = spotColor(theme);
  ctx.fillStyle = sc;
  const rng = localRng(m.colorIdx * 7919 + Math.round(m.capRx * 100));
  for (let _s = 0; _s < m.spotCount; _s++) {
    const angle = rng() * Math.PI + Math.PI;
    const r = m.capRx * 0.25 + rng() * m.capRx * 0.45;
    const sx = capX + Math.cos(angle) * r * 0.85;
    const sy = capY + Math.sin(angle) * m.capRy * 0.7;
    const sr = m.capRy * (0.06 + rng() * 0.09);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function localRng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Re-export ThemeName for use in play/page.tsx without extra imports.
export type { ThemeName };
