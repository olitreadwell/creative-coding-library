"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { hsl, hslString } from "@/lib/creative/color";
import { makeRng } from "@/lib/creative/random";
import { generateMaze, carveSteps } from "../maze";
import type { Cell, Step } from "../maze";
import { WALL_N, WALL_E, WALL_S, WALL_W } from "../maze";

// ── Layout constants ──────────────────────────────────────────────────────────

/** Minimum cell size in CSS pixels on the shortest axis. */
const MIN_CELL_PX = 16;
/** Maximum cell size in CSS pixels — keeps the maze readable on large screens. */
const MAX_CELL_PX = 32;
/** Wall line width as a fraction of the cell size. */
const WALL_WIDTH_RATIO = 0.07;
/** Number of carve steps to advance per animation frame. */
const STEPS_PER_FRAME = 4;

// ── Theme tokens ──────────────────────────────────────────────────────────────

type ThemeTokens = {
  bg: string;
  wall: string;
  passage: string;
  /** Hue for the carving-frontier highlight. */
  frontierHue: number;
};

const DARK_TOKENS: ThemeTokens = {
  bg: "#0d0d12",
  wall: "#e2e8f0",
  passage: "#1e2030",
  frontierHue: 200,
};

const LIGHT_TOKENS: ThemeTokens = {
  bg: "#f1f5f9",
  wall: "#1e293b",
  passage: "#ffffff",
  frontierHue: 210,
};

function resolveTokens(resolvedTheme: string | undefined): ThemeTokens {
  return resolvedTheme === "light" ? LIGHT_TOKENS : DARK_TOKENS;
}

// ── Maze state ────────────────────────────────────────────────────────────────

type MazeState = {
  cells: Cell[];
  steps: Step[];
  cols: number;
  rows: number;
  cellPx: number;
  /** Index into `steps` — how many carve steps have been applied so far. */
  stepCursor: number;
  done: boolean;
};

function buildMaze(canvasW: number, canvasH: number, seed: number): MazeState {
  const cellPx = Math.round(
    Math.max(MIN_CELL_PX, Math.min(MAX_CELL_PX, Math.min(canvasW, canvasH) / 20)),
  );

  const cols = Math.max(2, Math.floor(canvasW / cellPx));
  const rows = Math.max(2, Math.floor(canvasH / cellPx));

  const rng1 = makeRng(seed);
  const rng2 = makeRng(seed);

  const cells = generateMaze(cols, rows, rng1);
  const steps = carveSteps(cols, rows, rng2);

  // Reset all cells to all-walls-up for animation — the animation will replay
  // carving by applying steps one by one to a separate tracking structure.
  const animCells: Cell[] = cells.map((c) => ({
    col: c.col,
    row: c.row,
    walls: 0b1111,
  }));

  return { cells: animCells, steps, cols, rows, cellPx, stepCursor: 0, done: false };
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

/**
 * Applies carve steps up to the given cursor, mutating the cells array.
 * Returns the index of the most recently visited cell (for frontier highlight).
 */
function applyStepsUpTo(
  cells: Cell[],
  steps: Step[],
  prevCursor: number,
  nextCursor: number,
  cols: number,
): number {
  let lastIdx = -1;

  for (let i = prevCursor; i < nextCursor && i < steps.length; i++) {
    const step = steps[i];
    if (step === undefined) break;

    const { cellIndex, wallRemoved } = step;
    const cell = cells[cellIndex];
    if (cell === undefined) break;

    cell.walls &= ~wallRemoved;
    lastIdx = cellIndex;

    // Remove the opposite wall from the neighbour.
    const col = cellIndex % cols;
    const row = Math.floor(cellIndex / cols);

    let nIdx = -1;
    let oppositeWall = 0;

    if (wallRemoved === WALL_N && row > 0) {
      nIdx = (row - 1) * cols + col;
      oppositeWall = WALL_S;
    } else if (wallRemoved === WALL_S) {
      nIdx = (row + 1) * cols + col;
      oppositeWall = WALL_N;
    } else if (wallRemoved === WALL_E) {
      nIdx = row * cols + (col + 1);
      oppositeWall = WALL_W;
    } else if (wallRemoved === WALL_W && col > 0) {
      nIdx = row * cols + (col - 1);
      oppositeWall = WALL_E;
    }

    if (nIdx >= 0 && nIdx < cells.length) {
      const neighbour = cells[nIdx];
      if (neighbour !== undefined) {
        neighbour.walls &= ~oppositeWall;
      }
    }
  }

  return lastIdx;
}

/**
 * Draws the current maze state onto the canvas.
 *
 * Each cell is drawn as a filled rectangle (passage color), then walls are
 * stroked on the sides that are still up. The frontier cell gets a subtle
 * hue tint to show where the carver currently is.
 */
function drawMaze(
  ctx: CanvasRenderingContext2D,
  cells: Cell[],
  cols: number,
  rows: number,
  cellPx: number,
  tokens: ThemeTokens,
  frontierIdx: number,
  done: boolean,
): void {
  const w = cols * cellPx;
  const h = rows * cellPx;

  // ctx is already scaled by DPR in initCanvas, so all coordinates here are
  // CSS pixels. Use clientWidth/clientHeight for canvas CSS dimensions.
  const cssW = ctx.canvas.clientWidth;
  const cssH = ctx.canvas.clientHeight;

  // Offset to center the maze on the canvas.
  const ox = Math.floor((cssW - w) / 2);
  const oy = Math.floor((cssH - h) / 2);

  // Background — fill the full CSS area (context is DPR-scaled).
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const wallW = Math.max(1, Math.round(cellPx * WALL_WIDTH_RATIO));

  for (let idx = 0; idx < cells.length; idx++) {
    const cell = cells[idx];
    if (cell === undefined) continue;

    const x = ox + cell.col * cellPx;
    const y = oy + cell.row * cellPx;

    // Fill the cell passage area.
    if (!done && idx === frontierIdx) {
      // Frontier: tint with a subtle hue to show the active head.
      const tintColor = hslString(
        hsl(tokens.frontierHue, 0.7, tokens === LIGHT_TOKENS ? 0.65 : 0.35),
      );
      ctx.fillStyle = tintColor;
    } else {
      ctx.fillStyle = tokens.passage;
    }
    ctx.fillRect(x, y, cellPx, cellPx);

    // Draw walls on the sides that are still up.
    ctx.strokeStyle = tokens.wall;
    ctx.lineWidth = wallW;
    ctx.lineCap = "square";

    if (cell.walls & WALL_N) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + cellPx, y);
      ctx.stroke();
    }
    if (cell.walls & WALL_E) {
      ctx.beginPath();
      ctx.moveTo(x + cellPx, y);
      ctx.lineTo(x + cellPx, y + cellPx);
      ctx.stroke();
    }
    if (cell.walls & WALL_S) {
      ctx.beginPath();
      ctx.moveTo(x + cellPx, y + cellPx);
      ctx.lineTo(x, y + cellPx);
      ctx.stroke();
    }
    if (cell.walls & WALL_W) {
      ctx.beginPath();
      ctx.moveTo(x, y + cellPx);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

export default function MazePlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MazeState | null>(null);
  const rafRef = useRef<number>(0);
  const [seed, setSeed] = useState<number>(() => randomSeed());
  const [done, setDone] = useState<boolean>(false);

  const { resolvedTheme } = useTheme();
  // Guard undefined during SSR/hydration — default to 'dark'.
  const tokens = resolveTokens(resolvedTheme);
  const tokensRef = useRef<ThemeTokens>(tokens);
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  // Track done in a ref so the animation loop can read it without stale closure.
  const doneRef = useRef<boolean>(false);
  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  // ── Canvas setup + ResizeObserver ──────────────────────────────────────────

  const initCanvas = useCallback((canvas: HTMLCanvasElement, currentSeed: number): void => {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    if (cssW === 0 || cssH === 0) return;

    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    stateRef.current = buildMaze(cssW, cssH, currentSeed);
    doneRef.current = false;
    setDone(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    initCanvas(canvas, seed);

    const ro = new ResizeObserver(() => {
      const cv = canvasRef.current;
      if (!cv) return;
      initCanvas(cv, seed);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [seed, initCanvas]);

  // ── Animation loop ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let running = true;

    const loop = () => {
      if (!running) return;

      const state = stateRef.current;
      const ctx = canvas.getContext("2d");
      if (!state || !ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const prevCursor = state.stepCursor;
      const nextCursor = Math.min(state.stepCursor + STEPS_PER_FRAME, state.steps.length);

      const frontierIdx = applyStepsUpTo(
        state.cells,
        state.steps,
        prevCursor,
        nextCursor,
        state.cols,
      );
      state.stepCursor = nextCursor;

      if (!state.done && state.stepCursor >= state.steps.length) {
        state.done = true;
        doneRef.current = true;
        setDone(true);
      }

      drawMaze(
        ctx,
        state.cells,
        state.cols,
        state.rows,
        state.cellPx,
        tokensRef.current,
        frontierIdx,
        state.done,
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [seed]);

  // Also redraw when the theme changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawMaze(ctx, state.cells, state.cols, state.rows, state.cellPx, tokens, -1, state.done);
  }, [tokens]);

  // ── Interaction ────────────────────────────────────────────────────────────

  const handleNewMaze = useCallback(() => {
    setSeed(randomSeed());
  }, []);

  // ── Theme-aware Tailwind tokens ────────────────────────────────────────────

  const isDark = resolvedTheme !== "light";

  const pageBg = isDark ? "bg-[#0d0d12] text-white" : "bg-slate-100 text-slate-900";
  const borderCls = isDark ? "border-white/10" : "border-slate-300";
  const mutedText = isDark ? "text-white/60" : "text-slate-500";
  const headingText = isDark ? "text-white/80" : "text-slate-700";
  const btnCls = isDark
    ? "border-white/20 text-white/70 hover:border-white/50 hover:text-white focus-visible:ring-white/50"
    : "border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-900 focus-visible:ring-slate-400";

  return (
    <main className={`min-h-screen flex flex-col ${pageBg}`}>
      <header
        className={`px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-2 justify-between border-b ${borderCls} shrink-0`}
      >
        <nav aria-label="Page navigation">
          <Link
            href="/maze"
            aria-label="Back to Maze detail page"
            className={`inline-flex items-center gap-1 text-sm ${mutedText} hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/40 rounded`}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back
          </Link>
        </nav>

        <h1 className={`text-sm font-medium tracking-wide ${headingText}`}>Maze</h1>

        <div className="flex items-center gap-2">
          {done && (
            <span
              className={`text-xs ${mutedText}`}
              aria-live="polite"
              aria-label="Maze carving complete"
            >
              Done
            </span>
          )}
          <button
            type="button"
            onClick={handleNewMaze}
            aria-label="Generate a new maze with a random seed"
            className={`text-sm px-3 py-1 rounded border ${btnCls} transition-colors focus-visible:outline-none focus-visible:ring-2`}
          >
            New maze
          </button>
        </div>
      </header>

      <section
        className="flex-1 relative"
        aria-label="Maze carving animation. The algorithm carves passages depth-first."
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="Animated maze being carved by a depth-first backtracker. Watch passages open as the algorithm explores."
        />
      </section>

      <footer
        className={`px-4 sm:px-6 py-3 sm:py-4 text-xs ${mutedText} border-t ${borderCls} shrink-0`}
      >
        Recursive backtracker algorithm. Reference:{" "}
        <a
          href="https://en.wikipedia.org/wiki/Maze_generation_algorithm"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          Maze generation algorithm
        </a>
        . MIT licensed.
      </footer>
    </main>
  );
}
