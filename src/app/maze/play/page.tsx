"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp, cbColor } from "@/lib/creative";
import { hsl, hslString } from "@/lib/creative/color";
import { makeRng } from "@/lib/creative/random";
import { usePlaying } from "@/lib/creative/motion";
import { generateMaze, carveSteps } from "../maze";
import type { Cell, Step } from "../maze";
import { WALL_N, WALL_E, WALL_S, WALL_W } from "../maze";

// ── Layout constants ──────────────────────────────────────────────────────────

/** Minimum cell size the auto-fit logic will produce (CSS pixels). */
const AUTO_MIN_CELL_PX = 16;
/** Maximum cell size the auto-fit logic will produce (CSS pixels). */
const AUTO_MAX_CELL_PX = 32;
/** Wall line width as a fraction of the cell size. */
const WALL_WIDTH_RATIO = 0.07;
/** Default number of carve steps to advance per animation frame. */
const DEFAULT_STEPS_PER_FRAME = 4;

/** Slider bounds for the cell-size control. */
const CELL_PX_MIN = 8;
const CELL_PX_MAX = 48;

/** Slider bounds for the generation speed (steps per frame). */
const SPEED_MIN = 1;
const SPEED_MAX = 64;

// ── Theme tokens ──────────────────────────────────────────────────────────────

type ThemeTokens = {
  bg: string;
  wall: string;
  passage: string;
  /** Hue for the carving-frontier highlight. */
  frontierHue: number;
  /** Theme name for cbColor/cbRamp. */
  theme: "light" | "dark";
};

const DARK_TOKENS: ThemeTokens = {
  bg: "#0d0d12",
  wall: "#e2e8f0",
  passage: "#1e2030",
  frontierHue: 200,
  theme: "dark",
};

const LIGHT_TOKENS: ThemeTokens = {
  bg: "#f1f5f9",
  wall: "#1e293b",
  passage: "#ffffff",
  frontierHue: 210,
  theme: "light",
};

function resolveTokens(resolvedTheme: string | undefined): ThemeTokens {
  return resolvedTheme === "light" ? LIGHT_TOKENS : DARK_TOKENS;
}

// ── BFS solver ────────────────────────────────────────────────────────────────

/**
 * Finds the shortest path from top-left (0,0) to bottom-right (cols-1,rows-1)
 * on a fully-carved maze using breadth-first search.
 * Returns an array of flat cell indices representing the path, or [] if none.
 */
function solveMaze(cells: Cell[], cols: number, rows: number): number[] {
  const total = cols * rows;
  const startIdx = 0;
  const endIdx = total - 1;

  if (total === 1) return [0];

  const prev = new Int32Array(total).fill(-1);
  const visited = new Uint8Array(total);
  const queue: number[] = [startIdx];
  visited[startIdx] = 1;

  while (queue.length > 0) {
    const cur = queue.shift() as number;
    if (cur === endIdx) break;

    const cell = cells[cur];
    if (cell === undefined) continue;

    const col = cur % cols;
    const row = Math.floor(cur / cols);

    // North
    if (!(cell.walls & WALL_N) && row > 0) {
      const nIdx = (row - 1) * cols + col;
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        prev[nIdx] = cur;
        queue.push(nIdx);
      }
    }
    // East
    if (!(cell.walls & WALL_E) && col < cols - 1) {
      const nIdx = row * cols + (col + 1);
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        prev[nIdx] = cur;
        queue.push(nIdx);
      }
    }
    // South
    if (!(cell.walls & WALL_S) && row < rows - 1) {
      const nIdx = (row + 1) * cols + col;
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        prev[nIdx] = cur;
        queue.push(nIdx);
      }
    }
    // West
    if (!(cell.walls & WALL_W) && col > 0) {
      const nIdx = row * cols + (col - 1);
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        prev[nIdx] = cur;
        queue.push(nIdx);
      }
    }
  }

  if (prev[endIdx] === -1 && startIdx !== endIdx) return [];

  // Reconstruct path from end to start.
  const path: number[] = [];
  let cur = endIdx;
  while (cur !== -1) {
    path.push(cur);
    cur = prev[cur] as number;
  }
  path.reverse();
  return path;
}

// ── Maze state ────────────────────────────────────────────────────────────────

type MazeState = {
  /** The animated (partially carved) cells used by the draw loop. */
  cells: Cell[];
  /** The fully-carved cells used for solving. */
  fullCells: Cell[];
  steps: Step[];
  cols: number;
  rows: number;
  cellPx: number;
  /** Index into `steps` — how many carve steps have been applied so far. */
  stepCursor: number;
  done: boolean;
};

function buildMaze(
  canvasW: number,
  canvasH: number,
  seed: number,
  cellPxOverride: number | null,
): MazeState {
  const cellPx =
    cellPxOverride !== null
      ? cellPxOverride
      : Math.round(
          Math.max(AUTO_MIN_CELL_PX, Math.min(AUTO_MAX_CELL_PX, Math.min(canvasW, canvasH) / 20)),
        );

  const cols = Math.max(2, Math.floor(canvasW / cellPx));
  const rows = Math.max(2, Math.floor(canvasH / cellPx));

  const rng1 = makeRng(seed);
  const rng2 = makeRng(seed);

  const fullCells = generateMaze(cols, rows, rng1);
  const steps = carveSteps(cols, rows, rng2);

  // All-walls-up animation cells — the loop replays carving step by step.
  const animCells: Cell[] = fullCells.map((c) => ({
    col: c.col,
    row: c.row,
    walls: 0b1111,
  }));

  return {
    cells: animCells,
    fullCells,
    steps,
    cols,
    rows,
    cellPx,
    stepCursor: 0,
    done: false,
  };
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
 * Draws the current maze state onto the canvas, optionally overlaying a
 * solution path.
 *
 * Each cell is drawn as a filled rectangle (passage color), then walls are
 * stroked on the sides that are still up. The frontier cell gets a subtle
 * hue tint to show where the carver currently is.
 *
 * The solution path (if provided) is drawn as a centered line through cells
 * using cbRamp colors — blue-to-yellow on the Okabe-Ito axis, which stays
 * distinguishable from walls under protanopia.
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
  solutionPath: number[] | null,
): void {
  const w = cols * cellPx;
  const h = rows * cellPx;

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

  // Draw solution path overlay.
  if (solutionPath !== null && solutionPath.length > 1) {
    const pathLen = solutionPath.length - 1;
    const lineW = Math.max(2, Math.round(cellPx * 0.25));

    // Draw as a polyline through cell centers, segmented by color.
    for (let i = 0; i < pathLen; i++) {
      const fromIdx = solutionPath[i] as number;
      const toIdx = solutionPath[i + 1] as number;

      const fromCol = fromIdx % cols;
      const fromRow = Math.floor(fromIdx / cols);
      const toCol = toIdx % cols;
      const toRow = Math.floor(toIdx / cols);

      const fx = ox + fromCol * cellPx + cellPx / 2;
      const fy = oy + fromRow * cellPx + cellPx / 2;
      const tx = ox + toCol * cellPx + cellPx / 2;
      const ty = oy + toRow * cellPx + cellPx / 2;

      // Use cbRamp: t goes 0->1 along the path (blue at start, yellow at end).
      // Blue-yellow axis is protanopia-safe and contrasts with both wall colors.
      const t = i / pathLen;
      ctx.strokeStyle = cbRamp(t, tokens.theme);
      ctx.lineWidth = lineW;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }

    // Draw start and end markers using cbColor (index 0 = blue on dark, blue on light).
    const markerR = Math.max(3, Math.round(cellPx * 0.2));
    const startIdx = solutionPath[0] as number;
    const endIdxPath = solutionPath[pathLen] as number;

    const startCol = startIdx % cols;
    const startRow = Math.floor(startIdx / cols);
    const endCol = endIdxPath % cols;
    const endRow = Math.floor(endIdxPath / cols);

    // Start marker: cbColor(0) — sky blue (dark) / deep blue (light).
    ctx.fillStyle = cbColor(0, tokens.theme);
    ctx.beginPath();
    ctx.arc(
      ox + startCol * cellPx + cellPx / 2,
      oy + startRow * cellPx + cellPx / 2,
      markerR,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // End marker: cbColor(3) — yellow (dark) / purple (light), distinct from start.
    ctx.fillStyle = cbColor(3, tokens.theme);
    ctx.beginPath();
    ctx.arc(
      ox + endCol * cellPx + cellPx / 2,
      oy + endRow * cellPx + cellPx / 2,
      markerR,
      0,
      Math.PI * 2,
    );
    ctx.fill();
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

  // Cell-size override. null = auto-fit from canvas size (original behavior).
  const [cellPxOverride, setCellPxOverride] = useState<number | null>(null);
  // Steps per frame for animation speed.
  const [stepsPerFrame, setStepsPerFrame] = useState<number>(DEFAULT_STEPS_PER_FRAME);
  // Whether to show the solution path (only meaningful when done).
  const [showSolve, setShowSolve] = useState<boolean>(false);
  // The computed solution path (null until toggled on and maze is done).
  const [solutionPath, setSolutionPath] = useState<number[] | null>(null);
  // Auto-fit cell size from the last build, mirrored into state so the slider
  // label can show it without reading a ref during render.
  const [autoCellPx, setAutoCellPx] = useState<number>(AUTO_MIN_CELL_PX);

  const playing = usePlaying();
  const playingRef = useRef<boolean>(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const stepsPerFrameRef = useRef<number>(stepsPerFrame);
  useEffect(() => {
    stepsPerFrameRef.current = stepsPerFrame;
  }, [stepsPerFrame]);

  const solutionPathRef = useRef<number[] | null>(null);
  useEffect(() => {
    solutionPathRef.current = solutionPath;
  }, [solutionPath]);

  const { resolvedTheme } = useTheme();
  const tokens = resolveTokens(resolvedTheme);
  const tokensRef = useRef<ThemeTokens>(tokens);
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const doneRef = useRef<boolean>(false);
  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  // ── Canvas setup + ResizeObserver ──────────────────────────────────────────

  const initCanvas = useCallback(
    (
      canvas: HTMLCanvasElement,
      currentSeed: number,
      currentCellPxOverride: number | null,
      currentPlaying: boolean,
    ): void => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;

      if (cssW === 0 || cssH === 0) return;

      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const built = buildMaze(cssW, cssH, currentSeed, currentCellPxOverride);
      stateRef.current = built;
      setAutoCellPx(built.cellPx);

      if (!currentPlaying) {
        // Reduced motion or user-paused at load: skip animation and render the
        // fully-carved maze synchronously so the canvas is never blank/partial.
        applyStepsUpTo(built.cells, built.steps, 0, built.steps.length, built.cols);
        built.stepCursor = built.steps.length;
        built.done = true;
        doneRef.current = true;
        setDone(true);
        drawMaze(
          ctx,
          built.cells,
          built.cols,
          built.rows,
          built.cellPx,
          tokensRef.current,
          -1,
          true,
          null,
        );
      } else {
        doneRef.current = false;
        setDone(false);
      }
      setSolutionPath(null);
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use the ref so play/pause toggles mid-carve do not trigger a maze rebuild.
    // The init effect only needs to know the playing state at the time of build
    // (reduced-motion default or explicit pause before the first frame).
    initCanvas(canvas, seed, cellPxOverride, playingRef.current);

    const ro = new ResizeObserver(() => {
      const cv = canvasRef.current;
      if (!cv) return;
      initCanvas(cv, seed, cellPxOverride, playingRef.current);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
    // playingRef is intentionally excluded: toggling play/pause must not rebuild.
  }, [seed, cellPxOverride, initCanvas]);

  // ── Animation loop ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Do not start a RAF loop when paused. initCanvas already drew the fully-
    // carved maze under reduced-motion / paused-at-load conditions.
    if (!playing) return;

    let running = true;

    const loop = () => {
      if (!running) return;

      const state = stateRef.current;
      const ctx = canvas.getContext("2d");
      if (!state || !ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Freeze in place when paused mid-carve; resume from the same cursor
      // once playing is true again. The effect re-runs on every `playing`
      // change, so unpausing will re-enter this loop naturally.
      if (!playingRef.current || state.done) {
        return;
      }

      const prevCursor = state.stepCursor;
      const nextCursor = Math.min(state.stepCursor + stepsPerFrameRef.current, state.steps.length);

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
        solutionPathRef.current,
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [seed, cellPxOverride, playing]);

  // Redraw when the theme changes (keep solution path if active).
  useEffect(() => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawMaze(
      ctx,
      state.cells,
      state.cols,
      state.rows,
      state.cellPx,
      tokens,
      -1,
      state.done,
      solutionPathRef.current,
    );
  }, [tokens]);

  // Redraw when solve toggle changes (solution path applied or cleared).
  useEffect(() => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas || !state || !state.done) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawMaze(
      ctx,
      state.cells,
      state.cols,
      state.rows,
      state.cellPx,
      tokensRef.current,
      -1,
      true,
      solutionPathRef.current,
    );
  }, [solutionPath]);

  // ── Interaction ────────────────────────────────────────────────────────────

  const handleNewMaze = useCallback(() => {
    setShowSolve(false);
    setSolutionPath(null);
    setSeed(randomSeed());
  }, []);

  const handleCellSize = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowSolve(false);
    setSolutionPath(null);
    setCellPxOverride(Number(e.target.value));
  }, []);

  const handleSpeed = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setStepsPerFrame(Number(e.target.value));
  }, []);

  const handleSolveToggle = useCallback(() => {
    const state = stateRef.current;
    if (!state || !state.done) return;

    setShowSolve((prev) => {
      const next = !prev;
      if (next) {
        const path = solveMaze(state.fullCells, state.cols, state.rows);
        setSolutionPath(path);
      } else {
        setSolutionPath(null);
      }
      return next;
    });
  }, []);

  // Infer the displayed cell size for the slider label.
  const displayedCellPx = cellPxOverride !== null ? cellPxOverride : autoCellPx;

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const cellSizeLabelId = "maze-cell-size-label";
  const speedLabelId = "maze-speed-label";

  return (
    <PlayShell
      slug="maze"
      title="Maze"
      visualLabel="Depth-first maze being carved passage by passage"
      controls={
        <>
          {done && (
            <span
              className="text-xs text-foreground/60"
              aria-live="polite"
              aria-label="Maze carving complete"
            >
              Done
            </span>
          )}

          {/* Cell size / density slider */}
          <div className="flex items-center gap-2">
            <span id={cellSizeLabelId} className="text-xs text-foreground/70">
              density
            </span>
            <input
              type="range"
              min={CELL_PX_MIN}
              max={CELL_PX_MAX}
              value={displayedCellPx}
              onChange={handleCellSize}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={cellSizeLabelId}
              aria-valuemin={CELL_PX_MIN}
              aria-valuemax={CELL_PX_MAX}
              aria-valuenow={displayedCellPx}
              aria-label="Cell size — smaller values produce denser mazes"
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">
              {displayedCellPx}
            </span>
          </div>

          {/* Generation speed slider */}
          <div className="flex items-center gap-2">
            <span id={speedLabelId} className="text-xs text-foreground/70">
              speed
            </span>
            <input
              type="range"
              min={SPEED_MIN}
              max={SPEED_MAX}
              value={stepsPerFrame}
              onChange={handleSpeed}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={speedLabelId}
              aria-valuemin={SPEED_MIN}
              aria-valuemax={SPEED_MAX}
              aria-valuenow={stepsPerFrame}
              aria-label="Generation speed — steps carved per frame"
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">
              {stepsPerFrame}
            </span>
          </div>

          {/* Solve toggle */}
          <button
            type="button"
            onClick={handleSolveToggle}
            disabled={!done}
            aria-pressed={showSolve}
            aria-label={showSolve ? "Hide solution path" : "Show solution path from start to end"}
            className={`${btnClass} disabled:opacity-40 disabled:cursor-not-allowed aria-pressed:border-foreground/60 aria-pressed:text-foreground`}
          >
            {showSolve ? "Hide path" : "Solve"}
          </button>

          {/* New maze */}
          <button
            type="button"
            onClick={handleNewMaze}
            aria-label="Generate a new maze with a random seed"
            className={btnClass}
          >
            New maze
          </button>
        </>
      }
      attribution={
        <>
          Recursive backtracker algorithm. Reference:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Maze_generation_algorithm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Maze generation algorithm
          </a>
          . MIT licensed.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated maze being carved by a depth-first backtracker. Use controls to adjust density, speed, and reveal the solution path."
        suppressHydrationWarning
        style={{ background: tokens.bg }}
      />
    </PlayShell>
  );
}
