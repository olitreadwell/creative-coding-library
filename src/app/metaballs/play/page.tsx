"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Shuffle } from "lucide-react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { hsl, hslString } from "@/lib/creative/color";
import { clamp } from "@/lib/creative/math";
import { makeRng, randRange } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { fieldAt, marchingSquares } from "../field";
import type { Ball } from "../field";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of drifting blobs. */
const BALL_COUNT = 5;

/** Fraction of the canvas width used as radius for each ball. */
const RADIUS_FRACTION = 0.09;

/** Number of grid cells along the shorter axis. Smaller = coarser but faster. */
const GRID_CELLS = 60;

/**
 * Iso-value threshold. With the r^2/d^2 influence function, a ball's edge sits
 * at influence == 1 when d == r. Using 0.75 places the visible blob outline
 * slightly inside the radius so blobs start merging before they overlap.
 */
const THRESHOLD = 0.75;

/** Ball speed in pixels per second, relative to a 600px reference height. */
const BASE_SPEED = 90;

// ---------------------------------------------------------------------------
// Ball state (mutable, not React state — owned by the animation loop)
// ---------------------------------------------------------------------------

type BallState = Ball & {
  vx: number;
  vy: number;
};

/**
 * Spawns `count` balls with random positions and velocities, seeded for
 * reproducibility. The canvas dimensions are needed to bound the initial
 * positions.
 */
function spawnBalls(seed: number, w: number, h: number, count: number): BallState[] {
  const rng = makeRng(seed);
  const r = Math.min(w, h) * RADIUS_FRACTION;
  const speedScale = h / 600;
  const speed = BASE_SPEED * speedScale;

  return Array.from({ length: count }, () => {
    const angle = randRange(rng, 0, Math.PI * 2);
    return {
      x: randRange(rng, r, w - r),
      y: randRange(rng, r, h - r),
      r,
      vx: Math.cos(angle) * speed * randRange(rng, 0.6, 1.4),
      vy: Math.sin(angle) * speed * randRange(rng, 0.6, 1.4),
    };
  });
}

/**
 * Steps one ball by `dt` seconds, bouncing off axis-aligned walls.
 * Mutates the ball in place.
 */
function stepBall(ball: BallState, dt: number, w: number, h: number): void {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.r > w) {
    ball.x = w - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + ball.r > h) {
    ball.y = h - ball.r;
    ball.vy = -Math.abs(ball.vy);
  }
}

// ---------------------------------------------------------------------------
// Field sampling
// ---------------------------------------------------------------------------

/**
 * Fills a pre-allocated Float32Array with scalar field samples on a regular
 * grid covering the canvas. Returns the cell size in pixels.
 */
function sampleField(
  balls: readonly BallState[],
  values: Float32Array,
  cols: number,
  rows: number,
  cellSize: number,
): void {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellSize;
      const y = row * cellSize;
      const idx = row * cols + col;
      values[idx] = fieldAt(balls, x, y);
    }
  }
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

type Theme = "dark" | "light";

/** Hue used for the blob color (blue-teal family). */
const BLOB_HUE = 200;

/**
 * Draws the iso-contour and a flood-filled interior using Canvas 2D path ops.
 * The segments from marching squares are connected into paths by grouping
 * adjacent endpoints (simple O(n^2) stitching — acceptable for ≤a few thousand
 * segs at 60 Hz on a coarse grid).
 *
 * `contourColor` is a colorblind-safe hex string (from cbColor) used for the
 * blob stroke, improving protanopia legibility.
 */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  balls: readonly BallState[],
  values: Float32Array,
  cols: number,
  rows: number,
  cellSize: number,
  theme: Theme,
  contourColor: string,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // Background clear.
  if (theme === "dark") {
    ctx.fillStyle = "#0a0a0f";
  } else {
    ctx.fillStyle = "#f5f5f7";
  }
  ctx.fillRect(0, 0, w, h);

  // Sample the scalar field into the pre-allocated buffer.
  sampleField(balls, values, cols, rows, cellSize);

  // Get iso-contour segments.
  const segments = marchingSquares(values, cols, rows, cellSize, THRESHOLD);
  if (segments.length === 0) return;

  // --- Fill the iso-surface interior using the segment paths ---
  // Build closed paths by stitching endpoints. We use a simple greedy
  // approach: start a path, keep extending it while a matching endpoint
  // exists within epsilon, then close it.
  const EPSILON = cellSize * 0.55; // slightly more than half a cell diagonal
  const used = new Uint8Array(segments.length);

  // Fill color: translucent blob interior. Stroke uses the colorblind-safe
  // contour color for protanopia legibility.
  if (theme === "dark") {
    ctx.fillStyle = hslString(hsl(BLOB_HUE, 0.85, 0.55), 0.22);
    ctx.strokeStyle = contourColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = contourColor;
  } else {
    ctx.fillStyle = hslString(hsl(BLOB_HUE, 0.8, 0.46), 0.18);
    ctx.strokeStyle = contourColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }

  // Draw filled + stroked closed paths.
  const drawPaths = (): void => {
    for (let startIdx = 0; startIdx < segments.length; startIdx++) {
      if (used[startIdx]) continue;
      const startSeg = segments[startIdx];
      if (startSeg === undefined) continue;

      ctx.beginPath();
      ctx.moveTo(startSeg.x0, startSeg.y0);
      ctx.lineTo(startSeg.x1, startSeg.y1);
      used[startIdx] = 1;

      let curX = startSeg.x1;
      let curY = startSeg.y1;
      let extended = true;

      while (extended) {
        extended = false;
        for (let i = 0; i < segments.length; i++) {
          if (used[i]) continue;
          const seg = segments[i];
          if (seg === undefined) continue;

          const d0x = seg.x0 - curX;
          const d0y = seg.y0 - curY;
          const d1x = seg.x1 - curX;
          const d1y = seg.y1 - curY;

          if (d0x * d0x + d0y * d0y < EPSILON * EPSILON) {
            ctx.lineTo(seg.x1, seg.y1);
            curX = seg.x1;
            curY = seg.y1;
            used[i] = 1;
            extended = true;
            break;
          } else if (d1x * d1x + d1y * d1y < EPSILON * EPSILON) {
            ctx.lineTo(seg.x0, seg.y0);
            curX = seg.x0;
            curY = seg.y0;
            used[i] = 1;
            extended = true;
            break;
          }
        }
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  };

  drawPaths();

  // Reset shadow after stroking so it doesn't bleed into other draws.
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MetaballsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState<number>(() => Date.now());
  const [size, setSize] = useState<{ w: number; h: number; dpr: number } | null>(null);

  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";

  // Mutable animation state — not React state, owned by the loop ref.
  const ballsRef = useRef<BallState[]>([]);
  const valuesRef = useRef<Float32Array>(new Float32Array(0));
  const colsRef = useRef<number>(0);
  const rowsRef = useRef<number>(0);
  const cellSizeRef = useRef<number>(1);

  // -------------------------------------------------------------------
  // Resize + DPR handling
  // -------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = (): void => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;

      const w = Math.round(cssW * dpr);
      const h = Math.round(cssH * dpr);

      canvas.width = w;
      canvas.height = h;
      setSize({ w, h, dpr });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // -------------------------------------------------------------------
  // Re-spawn balls when seed or canvas size changes
  // -------------------------------------------------------------------

  useEffect(() => {
    if (!size) return;
    const { w, h } = size;

    ballsRef.current = spawnBalls(seed, w, h, BALL_COUNT);

    // Compute grid dimensions. The shorter axis gets GRID_CELLS cells;
    // the longer axis is proportional.
    const cellSize = Math.min(w, h) / GRID_CELLS;
    const cols = Math.ceil(w / cellSize) + 1;
    const rows = Math.ceil(h / cellSize) + 1;
    const clampedCellSize = clamp(cellSize, 1, 9999);

    cellSizeRef.current = clampedCellSize;
    colsRef.current = cols;
    rowsRef.current = rows;
    valuesRef.current = new Float32Array(cols * rows);
  }, [seed, size]);

  // -------------------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------------------

  // Colorblind-safe contour color: index 0 = sky blue on dark, deep blue on light.
  const contourColor = cbColor(0, resolvedTheme as "light" | "dark" | undefined);

  useAnimationFrame(
    useCallback(
      ({ dt }) => {
        const canvas = canvasRef.current;
        if (!canvas || !size) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const balls = ballsRef.current;
        const { w, h } = size;

        // Step physics.
        for (const ball of balls) {
          stepBall(ball, dt, w, h);
        }

        drawFrame(
          ctx,
          balls,
          valuesRef.current,
          colsRef.current,
          rowsRef.current,
          cellSizeRef.current,
          theme,
          contourColor,
        );
      },
      [size, theme, contourColor],
    ),
  );

  // -------------------------------------------------------------------
  // Shuffle handler
  // -------------------------------------------------------------------

  const handleShuffle = useCallback((): void => {
    setSeed(Date.now());
  }, []);

  const btnClass =
    "inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="metaballs"
      title="Metaballs"
      visualLabel="Organic blobs drifting and merging on a canvas"
      controls={
        <>
          <button
            type="button"
            onClick={handleShuffle}
            className={btnClass}
            aria-label="Shuffle: spawn new ball positions"
          >
            <Shuffle className="size-4" aria-hidden="true" />
            Shuffle
          </button>
        </>
      }
      attribution={
        <>
          Scalar field + marching squares iso-contour. Technique from{" "}
          <a
            href="https://en.wikipedia.org/wiki/Metaballs"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Jim Blinn&apos;s 1982 paper
          </a>
          . Canvas 2D, no external dependencies.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated metaballs: several glowing blobs drift around and merge when they get close, then separate again."
      />
    </PlayShell>
  );
}
