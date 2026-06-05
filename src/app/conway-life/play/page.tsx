"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { makeGrid, step } from "../life";

// Cell size in CSS pixels. Smaller = more cells on screen.
const CELL_PX = 8;
// Initial live-cell density: 28% gives a lively start without overcrowding.
const INITIAL_DENSITY = 0.28;
// Steps per second for the simulation (not every animation frame).
const STEPS_PER_SEC = 10;
const STEP_INTERVAL = 1 / STEPS_PER_SEC;
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
  const { resolvedTheme } = useTheme();

  // Shared stable ref so the animation callback always reads the latest value.
  const playingRef = useRef<boolean>(true);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Resolve the background color; guard undefined while theme hydrates.
  const canvasBg = resolvedTheme
    ? (CANVAS_BG[resolvedTheme] ?? CANVAS_BG_DEFAULT)
    : CANVAS_BG_DEFAULT;

  const canvasBgRef = useRef<string>(canvasBg);
  useEffect(() => {
    canvasBgRef.current = canvasBg;
  }, [canvasBg]);

  const initSim = useCallback(
    (canvas: HTMLCanvasElement, seedStr: string): void => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const cols = Math.max(1, Math.floor(w / CELL_PX));
      const rows = Math.max(1, Math.floor(h / CELL_PX));
      const rng = makeRng(seedStr);
      const grid = makeGrid(rng, cols, rows, INITIAL_DENSITY);

      stateRef.current = { grid, cols, rows, accumulated: 0 };

      // Paint the initial frame immediately so the canvas isn't blank on load.
      ctx.fillStyle = canvasBgRef.current;
      ctx.fillRect(0, 0, w, h);
      drawGrid(ctx, grid, cols, rows, w, h, resolvedTheme ?? "dark");
    },
    [resolvedTheme],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    initSim(cv, seed);

    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      initSim(canvas, seed);
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, initSim]);

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

        if (playingRef.current) {
          state.accumulated += dt;
          // Advance only when enough time has elapsed; skip multiple steps if
          // the tab was hidden and dt is large.
          while (state.accumulated >= STEP_INTERVAL) {
            state.grid = step(state.grid, cols, rows);
            state.accumulated -= STEP_INTERVAL;
          }
        }

        ctx.fillStyle = canvasBgRef.current;
        ctx.fillRect(0, 0, w, h);
        drawGrid(ctx, state.grid, cols, rows, w, h, resolvedTheme ?? "dark");
      },
      [resolvedTheme],
    ),
    { pauseWhenHidden: true, respectReducedMotion: true },
  );

  function handleRandomize(): void {
    setSeed(randomSeedString());
  }

  function handlePlayPause(): void {
    setPlaying((prev) => !prev);
  }

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="conway-life"
      title="Game of Life"
      visualLabel="Animated grid of cells evolving according to Conway's Game of Life rules"
      controls={
        <>
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
  theme: string,
): void {
  // Center the grid if it doesn't fill the canvas exactly.
  const offsetX = (w - cols * CELL_PX) / 2;
  const offsetY = (h - rows * CELL_PX) / 2;
  const r = CELL_PX * CORNER_RADIUS_RATIO;

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

      const x = offsetX + col * CELL_PX + 1;
      const y = offsetY + row * CELL_PX + 1;
      const size = CELL_PX - 2;

      ctx.beginPath();
      ctx.roundRect(x, y, size, size, r);
      ctx.fill();
    }
  }
}
