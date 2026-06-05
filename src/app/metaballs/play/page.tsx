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
// Default parameter values — unchanged from the original so the default look
// is identical to before the controls were added.
// ---------------------------------------------------------------------------

const DEFAULT_BALL_COUNT = 5;
const DEFAULT_THRESHOLD = 0.75;
const DEFAULT_SPEED = 90; // pixels/sec at 600px reference height
const DEFAULT_RADIUS_FRACTION = 0.09; // fraction of Math.min(w, h)

/** Number of grid cells along the shorter axis. Smaller = coarser but faster. */
const GRID_CELLS = 60;

/** Hue used for the blob color (blue-teal family). */
const BLOB_HUE = 200;

// ---------------------------------------------------------------------------
// Slider range constants
// ---------------------------------------------------------------------------

const MIN_BALLS = 3;
const MAX_BALLS = 15;

const MIN_THRESHOLD = 0.3;
const MAX_THRESHOLD = 1.5;
const STEP_THRESHOLD = 0.05;

const MIN_SPEED = 20;
const MAX_SPEED = 300;

const MIN_RADIUS = 0.04;
const MAX_RADIUS = 0.2;
const STEP_RADIUS = 0.01;

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
 * positions. `radiusFraction` controls each ball's influence radius relative
 * to the shorter canvas dimension.
 */
function spawnBalls(
  seed: number,
  w: number,
  h: number,
  count: number,
  radiusFraction: number,
  baseSpeed: number,
): BallState[] {
  const rng = makeRng(seed);
  const r = Math.min(w, h) * radiusFraction;
  const speedScale = h / 600;
  const speed = baseSpeed * speedScale;

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
 * The `speedMultiplier` scales velocities live without re-spawning.
 * Mutates the ball in place.
 */
function stepBall(
  ball: BallState,
  dt: number,
  w: number,
  h: number,
  speedMultiplier: number,
): void {
  ball.x += ball.vx * dt * speedMultiplier;
  ball.y += ball.vy * dt * speedMultiplier;

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
 * grid covering the canvas.
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

/**
 * Draws the iso-contour and a flood-filled interior using Canvas 2D path ops.
 * `threshold` controls where the iso-surface sits; `contourColor` is a
 * colorblind-safe hex string (from cbColor) used for the blob stroke.
 *
 * `cssW` and `cssH` are the canvas dimensions in CSS pixels. The caller must
 * have set `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` before calling this so
 * that CSS-pixel coordinates map to device pixels correctly.
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
  threshold: number,
  cssW: number,
  cssH: number,
): void {
  const w = cssW;
  const h = cssH;

  // Background clear.
  if (theme === "dark") {
    ctx.fillStyle = "#0a0a0f";
  } else {
    ctx.fillStyle = "#f5f5f7";
  }
  ctx.fillRect(0, 0, w, h);

  // Sample the scalar field into the pre-allocated buffer.
  sampleField(balls, values, cols, rows, cellSize);

  // Get iso-contour segments using the current threshold.
  const segments = marchingSquares(values, cols, rows, cellSize, threshold);
  if (segments.length === 0) return;

  // --- Fill the iso-surface interior using the segment paths ---
  const EPSILON = cellSize * 0.55;
  const used = new Uint8Array(segments.length);

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
  const [size, setSize] = useState<{ cssW: number; cssH: number; dpr: number } | null>(null);

  // --- Configurable parameters (React state, drive controls) ---
  const [ballCount, setBallCount] = useState<number>(DEFAULT_BALL_COUNT);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEED);
  const [radiusFraction, setRadiusFraction] = useState<number>(DEFAULT_RADIUS_FRACTION);

  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";

  // Mutable animation state — not React state, owned by the loop ref.
  const ballsRef = useRef<BallState[]>([]);
  const valuesRef = useRef<Float32Array>(new Float32Array(0));
  const colsRef = useRef<number>(0);
  const rowsRef = useRef<number>(0);
  const cellSizeRef = useRef<number>(1);

  // Keep refs for parameters that the animation loop reads every frame so it
  // always sees the latest value without needing a callback re-wrap.
  const thresholdRef = useRef<number>(threshold);
  const speedRef = useRef<number>(speed);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

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

      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      setSize({ cssW, cssH, dpr });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // -------------------------------------------------------------------
  // Re-spawn balls when seed, canvas size, blob count, or radius changes.
  // Speed changes are applied live via the speedRef; no re-spawn needed.
  // -------------------------------------------------------------------

  useEffect(() => {
    if (!size) return;
    const { cssW, cssH } = size;

    ballsRef.current = spawnBalls(seed, cssW, cssH, ballCount, radiusFraction, DEFAULT_SPEED);

    // Compute grid dimensions. The shorter axis gets GRID_CELLS cells;
    // the longer axis is proportional. Grid runs in CSS-pixel space.
    const cellSize = Math.min(cssW, cssH) / GRID_CELLS;
    const cols = Math.ceil(cssW / cellSize) + 1;
    const rows = Math.ceil(cssH / cellSize) + 1;
    const clampedCellSize = clamp(cellSize, 1, 9999);

    cellSizeRef.current = clampedCellSize;
    colsRef.current = cols;
    rowsRef.current = rows;
    valuesRef.current = new Float32Array(cols * rows);
  }, [seed, size, ballCount, radiusFraction]);

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
        const { cssW, cssH, dpr } = size;
        const currentSpeedMult = speedRef.current / DEFAULT_SPEED;

        // Step physics with live speed multiplier in CSS-pixel space.
        for (const ball of balls) {
          stepBall(ball, dt, cssW, cssH, currentSpeedMult);
        }

        // Map CSS-pixel coordinates to device pixels each frame.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        drawFrame(
          ctx,
          balls,
          valuesRef.current,
          colsRef.current,
          rowsRef.current,
          cellSizeRef.current,
          theme,
          contourColor,
          thresholdRef.current,
          cssW,
          cssH,
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

  // -------------------------------------------------------------------
  // Control label IDs
  // -------------------------------------------------------------------

  const blobCountLabelId = "metaballs-blob-count-label";
  const thresholdLabelId = "metaballs-threshold-label";
  const speedLabelId = "metaballs-speed-label";
  const radiusLabelId = "metaballs-radius-label";

  const btnClass =
    "inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="metaballs"
      title="Metaballs"
      visualLabel="Organic blobs drifting and merging on a canvas"
      controls={
        <>
          {/* Blob count — re-spawns balls */}
          <div className="flex items-center gap-2">
            <span id={blobCountLabelId} className="text-xs text-foreground/70">
              blobs
            </span>
            <input
              type="range"
              min={MIN_BALLS}
              max={MAX_BALLS}
              step={1}
              value={ballCount}
              onChange={(e) => setBallCount(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={blobCountLabelId}
              aria-valuemin={MIN_BALLS}
              aria-valuemax={MAX_BALLS}
              aria-valuenow={ballCount}
            />
            <span className="w-5 text-right text-xs text-foreground/70 tabular-nums">
              {ballCount}
            </span>
          </div>

          {/* Threshold — live iso-surface cutoff */}
          <div className="flex items-center gap-2">
            <span id={thresholdLabelId} className="text-xs text-foreground/70">
              merge
            </span>
            <input
              type="range"
              min={MIN_THRESHOLD}
              max={MAX_THRESHOLD}
              step={STEP_THRESHOLD}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={thresholdLabelId}
              aria-valuemin={MIN_THRESHOLD}
              aria-valuemax={MAX_THRESHOLD}
              aria-valuenow={threshold}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {threshold.toFixed(2)}
            </span>
          </div>

          {/* Speed — live drift multiplier */}
          <div className="flex items-center gap-2">
            <span id={speedLabelId} className="text-xs text-foreground/70">
              speed
            </span>
            <input
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={speedLabelId}
              aria-valuemin={MIN_SPEED}
              aria-valuemax={MAX_SPEED}
              aria-valuenow={speed}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">{speed}</span>
          </div>

          {/* Radius fraction — re-spawns balls with new size */}
          <div className="flex items-center gap-2">
            <span id={radiusLabelId} className="text-xs text-foreground/70">
              size
            </span>
            <input
              type="range"
              min={MIN_RADIUS}
              max={MAX_RADIUS}
              step={STEP_RADIUS}
              value={radiusFraction}
              onChange={(e) => setRadiusFraction(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={radiusLabelId}
              aria-valuemin={MIN_RADIUS}
              aria-valuemax={MAX_RADIUS}
              aria-valuenow={radiusFraction}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {Math.round(radiusFraction * 100)}%
            </span>
          </div>

          {/* Shuffle — re-seeds positions */}
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
