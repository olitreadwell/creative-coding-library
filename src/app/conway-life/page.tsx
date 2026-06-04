"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { makeGrid, step } from "./life";

// Cell size in CSS pixels. Smaller = more cells on screen.
const CELL_PX = 8;
// Initial live-cell density: 28% gives a lively start without overcrowding.
const INITIAL_DENSITY = 0.28;
// Steps per second for the simulation (not every animation frame).
const STEPS_PER_SEC = 10;
const STEP_INTERVAL = 1 / STEPS_PER_SEC;
// Background color: very dark navy, not pure black.
const BG = "#050810";
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

export default function ConwayLifePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SimState | null>(null);
  const [seed, setSeed] = useState<string>("conway-life");
  const [playing, setPlaying] = useState<boolean>(true);

  // Shared stable ref so the animation callback always reads the latest value.
  const playingRef = useRef<boolean>(true);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const initSim = useCallback((canvas: HTMLCanvasElement, seedStr: string): void => {
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
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
    drawGrid(ctx, grid, cols, rows, w, h);
  }, []);

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
    useCallback(({ dt }: FrameInfo) => {
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

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);
      drawGrid(ctx, state.grid, cols, rows, w, h);
    }, []),
    { pauseWhenHidden: true, respectReducedMotion: true },
  );

  function handleRandomize(): void {
    setSeed(randomSeedString());
  }

  function handlePlayPause(): void {
    setPlaying((prev) => !prev);
  }

  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white underline underline-offset-2"
          >
            &larr; home
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide text-white/80">Game of Life</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRandomize}
            className="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/50 text-white/70 hover:text-white transition-colors"
            aria-label="Randomize with a new seed"
          >
            Randomize
          </button>
          <button
            type="button"
            onClick={handlePlayPause}
            className="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/50 text-white/70 hover:text-white transition-colors"
            aria-label={playing ? "Pause simulation" : "Play simulation"}
          >
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </header>

      <section className="flex-1 relative" aria-label="Conway's Game of Life simulation">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
          style={{ background: BG }}
        />
      </section>

      <footer className="px-6 py-4 text-xs text-white/30 border-t border-white/10">
        Technique: toroidal Conway step + Canvas 2D. Original concept by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-white/60"
        >
          John Conway (1970)
        </a>
        .
      </footer>
    </main>
  );
}

/** Draw all live cells as rounded squares tinted by neighbor count. */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Uint8Array,
  cols: number,
  rows: number,
  w: number,
  h: number,
): void {
  // Center the grid if it doesn't fill the canvas exactly.
  const offsetX = (w - cols * CELL_PX) / 2;
  const offsetY = (h - rows * CELL_PX) / 2;
  const r = CELL_PX * CORNER_RADIUS_RATIO;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellIdx = row * cols + col;
      if ((grid[cellIdx] ?? 0) === 0) continue;

      // Tint hue slightly by column position for a gradient across the grid.
      const hue = map(col, 0, cols - 1, BASE_HUE, BASE_HUE + HUE_SPREAD);
      const lightness = 0.55 + map(row, 0, rows - 1, 0, 0.15);
      ctx.fillStyle = hslString(hsl(hue, 0.75, lightness));

      const x = offsetX + col * CELL_PX + 1;
      const y = offsetY + row * CELL_PX + 1;
      const size = CELL_PX - 2;

      ctx.beginPath();
      ctx.roundRect(x, y, size, size, r);
      ctx.fill();
    }
  }
}
