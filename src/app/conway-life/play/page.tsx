"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { makeGrid, step } from "../life";

// Canvas background per resolved theme.
const CANVAS_BG: Record<string, string> = {
  light: "#e8eaf0",
  dark: "#050810",
};
const CANVAS_BG_DEFAULT = "#050810";
// Base hue for live cells (blue-purple range).
const BASE_HUE = 200;
const HUE_SPREAD = 120;
// Corner radius for rounded cells, as a fraction of cell size.
const CORNER_RADIUS_RATIO = 0.3;

// Control bounds and defaults (defaults match the original constants).
const DEFAULT_CELL_PX = 8;
const MIN_CELL_PX = 4;
const MAX_CELL_PX = 16;

const DEFAULT_DENSITY = 0.28;
const MIN_DENSITY = 0.05;
const MAX_DENSITY = 0.6;
const DENSITY_STEP = 0.01;

const DEFAULT_STEPS_PER_SEC = 10;
const MIN_STEPS_PER_SEC = 1;
const MAX_STEPS_PER_SEC = 30;

function randomSeedString(): string {
  return Math.random().toString(36).slice(2, 10);
}

type SimState = {
  grid: Uint8Array;
  cols: number;
  rows: number;
  accumulated: number;
};

export default function ConwayLifePlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SimState | null>(null);

  const [seed, setSeed] = useState<string>(() => randomSeedString());
  const [playing, setPlaying] = useState<boolean>(true);
  const [cellPx, setCellPx] = useState<number>(DEFAULT_CELL_PX);
  const [density, setDensity] = useState<number>(DEFAULT_DENSITY);
  const [stepsPerSec, setStepsPerSec] = useState<number>(DEFAULT_STEPS_PER_SEC);

  const { resolvedTheme } = useTheme();

  // Stable refs so the animation callback always reads the latest values
  // without needing to be recreated.
  const playingRef = useRef<boolean>(true);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const stepsPerSecRef = useRef<number>(DEFAULT_STEPS_PER_SEC);
  useEffect(() => {
    stepsPerSecRef.current = stepsPerSec;
  }, [stepsPerSec]);

  // Resolve the background color; guard undefined while theme hydrates.
  const canvasBg = resolvedTheme
    ? (CANVAS_BG[resolvedTheme] ?? CANVAS_BG_DEFAULT)
    : CANVAS_BG_DEFAULT;

  const canvasBgRef = useRef<string>(canvasBg);
  useEffect(() => {
    canvasBgRef.current = canvasBg;
  }, [canvasBg]);

  const initSim = useCallback(
    (
      canvas: HTMLCanvasElement,
      seedStr: string,
      currentCellPx: number,
      currentDensity: number,
      gridOnly: boolean,
    ): void => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (!gridOnly) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!gridOnly) {
        ctx.scale(dpr, dpr);
      }

      const cols = Math.max(1, Math.floor(w / currentCellPx));
      const rows = Math.max(1, Math.floor(h / currentCellPx));
      const rng = makeRng(seedStr);
      const grid = makeGrid(rng, cols, rows, currentDensity);

      stateRef.current = { grid, cols, rows, accumulated: 0 };

      // Paint the initial frame immediately so the canvas isn't blank on load.
      ctx.fillStyle = canvasBgRef.current;
      ctx.fillRect(0, 0, w, h);
      drawGrid(ctx, grid, cols, rows, w, h, currentCellPx, resolvedTheme ?? "dark");
    },
    [resolvedTheme],
  );

  // Re-init when seed, cell size, density, or theme changes.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    initSim(cv, seed, cellPx, density, false);

    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      initSim(canvas, seed, cellPx, density, false);
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, cellPx, density, initSim]);

  useAnimationFrame(
    useCallback(
      ({ dt }: FrameInfo) => {
        const cv = canvasRef.current;
        if (!cv) return;
        const ctx = cv.getContext("2d");
        if (!ctx) return;
        const state = stateRef.current;
        if (!state) return;

        const { cols, rows } = state;
        const w = cv.clientWidth;
        const h = cv.clientHeight;
        const stepInterval = 1 / stepsPerSecRef.current;

        if (playingRef.current) {
          state.accumulated += dt;
          // Advance only when enough time has elapsed; skip multiple steps if
          // the tab was hidden and dt is large.
          while (state.accumulated >= stepInterval) {
            state.grid = step(state.grid, cols, rows);
            state.accumulated -= stepInterval;
          }
        }

        ctx.fillStyle = canvasBgRef.current;
        ctx.fillRect(0, 0, w, h);
        drawGrid(ctx, state.grid, cols, rows, w, h, cellPx, resolvedTheme ?? "dark");
      },
      [resolvedTheme, cellPx],
    ),
    { pauseWhenHidden: true },
  );

  function handleRandomize(): void {
    setSeed(randomSeedString());
  }

  function handlePlayPause(): void {
    setPlaying((prev) => !prev);
  }

  function handleStep(): void {
    const state = stateRef.current;
    const cv = canvasRef.current;
    if (!state || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    state.grid = step(state.grid, state.cols, state.rows);
    state.accumulated = 0;

    const w = cv.clientWidth;
    const h = cv.clientHeight;
    ctx.fillStyle = canvasBgRef.current;
    ctx.fillRect(0, 0, w, h);
    drawGrid(ctx, state.grid, state.cols, state.rows, w, h, cellPx, resolvedTheme ?? "dark");
  }

  function handleClear(): void {
    const state = stateRef.current;
    const cv = canvasRef.current;
    if (!state || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    state.grid = new Uint8Array(state.cols * state.rows);
    state.accumulated = 0;

    const w = cv.clientWidth;
    const h = cv.clientHeight;
    ctx.fillStyle = canvasBgRef.current;
    ctx.fillRect(0, 0, w, h);
  }

  const speedLabelId = "speed-label";
  const densityLabelId = "density-label";
  const cellSizeLabelId = "cell-size-label";

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="conway-life"
      title="Game of Life"
      visualLabel="Animated grid of cells evolving according to Conway's Game of Life rules"
      controls={
        <>
          {/* Speed slider */}
          <div className="flex items-center gap-2">
            <span id={speedLabelId} className="text-xs text-foreground/70">
              speed
            </span>
            <input
              type="range"
              min={MIN_STEPS_PER_SEC}
              max={MAX_STEPS_PER_SEC}
              value={stepsPerSec}
              onChange={(e) => setStepsPerSec(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={speedLabelId}
              aria-valuemin={MIN_STEPS_PER_SEC}
              aria-valuemax={MAX_STEPS_PER_SEC}
              aria-valuenow={stepsPerSec}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {stepsPerSec}
            </span>
          </div>

          {/* Density slider */}
          <div className="flex items-center gap-2">
            <span id={densityLabelId} className="text-xs text-foreground/70">
              density
            </span>
            <input
              type="range"
              min={MIN_DENSITY}
              max={MAX_DENSITY}
              step={DENSITY_STEP}
              value={density}
              onChange={(e) => {
                setDensity(Number(e.target.value));
                setSeed(randomSeedString());
              }}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={densityLabelId}
              aria-valuemin={MIN_DENSITY}
              aria-valuemax={MAX_DENSITY}
              aria-valuenow={density}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {Math.round(density * 100)}%
            </span>
          </div>

          {/* Cell size slider */}
          <div className="flex items-center gap-2">
            <span id={cellSizeLabelId} className="text-xs text-foreground/70">
              cells
            </span>
            <input
              type="range"
              min={MIN_CELL_PX}
              max={MAX_CELL_PX}
              value={cellPx}
              onChange={(e) => setCellPx(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={cellSizeLabelId}
              aria-valuemin={MIN_CELL_PX}
              aria-valuemax={MAX_CELL_PX}
              aria-valuenow={cellPx}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {cellPx}px
            </span>
          </div>

          {/* Existing buttons */}
          <button
            type="button"
            onClick={handleRandomize}
            className={btnClass}
            aria-label="Randomize with a new seed"
          >
            Randomize
          </button>
          <button
            type="button"
            onClick={handlePlayPause}
            className={btnClass}
            aria-label={playing ? "Pause simulation" : "Play simulation"}
          >
            {playing ? "Pause" : "Play"}
          </button>

          {/* New action buttons */}
          <button
            type="button"
            onClick={handleStep}
            className={btnClass}
            aria-label="Advance one generation"
          >
            Step
          </button>
          <button
            type="button"
            onClick={handleClear}
            className={btnClass}
            aria-label="Clear all cells"
          >
            Clear
          </button>
        </>
      }
      attribution={
        <>
          Technique: toroidal Conway step + Canvas 2D. Original concept by{" "}
          <a
            href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            John Conway (1970)
          </a>
          .
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated grid of cells evolving according to Conway's Game of Life rules"
        suppressHydrationWarning
        style={{ background: canvasBg }}
      />
    </PlayShell>
  );
}

/**
 * Draw all live cells as rounded squares tinted by neighbor count.
 * Cell colors are adjusted for light/dark theme so they stay readable.
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Uint8Array,
  cols: number,
  rows: number,
  w: number,
  h: number,
  cellPx: number,
  theme: string,
): void {
  // Center the grid if it doesn't fill the canvas exactly.
  const offsetX = (w - cols * cellPx) / 2;
  const offsetY = (h - rows * cellPx) / 2;
  const r = cellPx * CORNER_RADIUS_RATIO;

  // On light backgrounds, use darker + more saturated cells so they read
  // clearly against #e8eaf0. Target AA contrast: hsl(200-320, 85%, 28-38%)
  // gives relative luminance well below 0.18, contrast > 4.5:1 on that bg.
  const lightnessBase = theme === "light" ? 0.28 : 0.55;
  const lightnessRange = theme === "light" ? 0.1 : 0.15;
  const saturation = theme === "light" ? 0.85 : 0.75;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellIdx = row * cols + col;
      if ((grid[cellIdx] ?? 0) === 0) continue;

      // Tint hue slightly by column position for a gradient across the grid.
      const hue = map(col, 0, cols - 1, BASE_HUE, BASE_HUE + HUE_SPREAD);
      const lightness = lightnessBase + map(row, 0, rows - 1, 0, lightnessRange);
      ctx.fillStyle = hslString(hsl(hue, saturation, lightness));

      const x = offsetX + col * cellPx + 1;
      const y = offsetY + row * cellPx + 1;
      const size = cellPx - 2;

      ctx.beginPath();
      ctx.roundRect(x, y, size, size, r);
      ctx.fill();
    }
  }
}
