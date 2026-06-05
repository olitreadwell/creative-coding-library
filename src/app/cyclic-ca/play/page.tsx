"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor, type ThemeName } from "@/lib/creative/cbpalette";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { makeGrid, step } from "../cyclic";

const CANVAS_BG: Record<string, string> = {
  light: "#f0f0f0",
  dark: "#0a0a0a",
};
const CANVAS_BG_DEFAULT = "#0a0a0a";

const DEFAULT_STATES = 5;
const MIN_STATES = 3;
const MAX_STATES = 8;

const DEFAULT_THRESHOLD = 3;
const MIN_THRESHOLD = 1;
const MAX_THRESHOLD = 4;

const DEFAULT_CELL_PX = 6;
const MIN_CELL_PX = 4;
const MAX_CELL_PX = 16;

const DEFAULT_STEPS_PER_SEC = 12;
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

export default function CyclicCAPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SimState | null>(null);

  const [seed, setSeed] = useState<string>(() => randomSeedString());
  const [numStates, setNumStates] = useState<number>(DEFAULT_STATES);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [cellPx, setCellPx] = useState<number>(DEFAULT_CELL_PX);
  const [stepsPerSec, setStepsPerSec] = useState<number>(DEFAULT_STEPS_PER_SEC);

  const { resolvedTheme } = useTheme();

  const numStatesRef = useRef<number>(DEFAULT_STATES);
  useEffect(() => {
    numStatesRef.current = numStates;
  }, [numStates]);

  const thresholdRef = useRef<number>(DEFAULT_THRESHOLD);
  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const stepsPerSecRef = useRef<number>(DEFAULT_STEPS_PER_SEC);
  useEffect(() => {
    stepsPerSecRef.current = stepsPerSec;
  }, [stepsPerSec]);

  const canvasBg = resolvedTheme
    ? (CANVAS_BG[resolvedTheme] ?? CANVAS_BG_DEFAULT)
    : CANVAS_BG_DEFAULT;

  const canvasBgRef = useRef<string>(canvasBg);
  useEffect(() => {
    canvasBgRef.current = canvasBg;
  }, [canvasBg]);

  const resolvedThemeRef = useRef<string>(resolvedTheme ?? "dark");
  useEffect(() => {
    resolvedThemeRef.current = resolvedTheme ?? "dark";
  }, [resolvedTheme]);

  const initSim = useCallback(
    (canvas: HTMLCanvasElement, seedStr: string, currentCellPx: number, resize: boolean): void => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (resize) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (resize) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const cols = Math.max(1, Math.floor(w / currentCellPx));
      const rows = Math.max(1, Math.floor(h / currentCellPx));
      const rng = makeRng(seedStr);
      const grid = makeGrid(rng, cols, rows, numStatesRef.current);

      stateRef.current = { grid, cols, rows, accumulated: 0 };

      ctx.fillStyle = canvasBgRef.current;
      ctx.fillRect(0, 0, w, h);
      drawGrid(
        ctx,
        grid,
        cols,
        rows,
        w,
        h,
        currentCellPx,
        numStatesRef.current,
        (resolvedThemeRef.current as ThemeName) ?? "dark",
      );
    },
    [],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    initSim(cv, seed, cellPx, true);

    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      initSim(canvas, seed, cellPx, true);
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, cellPx, numStates, initSim]);

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
        const states = numStatesRef.current;
        const thresh = thresholdRef.current;

        state.accumulated += dt;
        while (state.accumulated >= stepInterval) {
          state.grid = step(state.grid, cols, rows, states, thresh);
          state.accumulated -= stepInterval;
        }

        ctx.fillStyle = canvasBgRef.current;
        ctx.fillRect(0, 0, w, h);
        drawGrid(
          ctx,
          state.grid,
          cols,
          rows,
          w,
          h,
          cellPx,
          states,
          (resolvedTheme as ThemeName) ?? "dark",
        );
      },
      [resolvedTheme, cellPx],
    ),
    { pauseWhenHidden: true },
  );

  function handleRandomize(): void {
    setSeed(randomSeedString());
  }

  const statesLabelId = "states-label";
  const thresholdLabelId = "threshold-label";
  const speedLabelId = "speed-label";
  const cellSizeLabelId = "cell-size-label";

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="cyclic-ca"
      title="Cyclic Automaton"
      visualLabel="Animated grid of cells cycling through colors in a rock-paper-scissors pattern, forming rotating spirals"
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={statesLabelId} className="text-xs text-foreground/70">
              states
            </span>
            <input
              type="range"
              min={MIN_STATES}
              max={MAX_STATES}
              value={numStates}
              onChange={(e) => {
                setNumStates(Number(e.target.value));
                setSeed(randomSeedString());
              }}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={statesLabelId}
              aria-valuemin={MIN_STATES}
              aria-valuemax={MAX_STATES}
              aria-valuenow={numStates}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">
              {numStates}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span id={thresholdLabelId} className="text-xs text-foreground/70">
              threshold
            </span>
            <input
              type="range"
              min={MIN_THRESHOLD}
              max={MAX_THRESHOLD}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={thresholdLabelId}
              aria-valuemin={MIN_THRESHOLD}
              aria-valuemax={MAX_THRESHOLD}
              aria-valuenow={threshold}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">
              {threshold}
            </span>
          </div>

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
              {stepsPerSec}/s
            </span>
          </div>

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

          <button
            type="button"
            onClick={handleRandomize}
            className={btnClass}
            aria-label="Randomize with a new seed"
          >
            Randomize
          </button>
        </>
      }
      attribution={
        <>
          Technique: cyclic cellular automaton on Canvas 2D. Concept from{" "}
          <a
            href="https://en.wikipedia.org/wiki/Cyclic_cellular_automaton"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Cyclic CA (Griffeath, 1988)
          </a>
          .
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated grid of cells cycling through colors in a rock-paper-scissors pattern, forming rotating spirals"
        suppressHydrationWarning
        style={{ background: canvasBg }}
      />
    </PlayShell>
  );
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Uint8Array,
  cols: number,
  rows: number,
  w: number,
  h: number,
  cellPx: number,
  states: number,
  theme: ThemeName,
): void {
  const offsetX = (w - cols * cellPx) / 2;
  const offsetY = (h - rows * cellPx) / 2;

  // Build a color lookup table once per draw call to avoid calling cbColor
  // inside the inner loop. With up to 8 states the table is tiny.
  const palette: string[] = [];
  for (let s = 0; s < states; s++) {
    palette.push(cbColor(s, theme));
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const state = grid[row * cols + col] ?? 0;
      ctx.fillStyle = palette[state] ?? palette[0] ?? "#000";
      ctx.fillRect(offsetX + col * cellPx, offsetY + row * cellPx, cellPx, cellPx);
    }
  }
}
