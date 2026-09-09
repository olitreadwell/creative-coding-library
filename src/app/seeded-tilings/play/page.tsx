"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { makeRng } from "@/lib/creative/random";
import { tileGrid, gridDimensions, drawTileStyled } from "../tiling";
import type { TileStyle } from "../tiling";

const DEFAULT_TILE_SIZE = 60;
const DEFAULT_LINE_WIDTH_RATIO = 0.12;
const MIN_TILE_SIZE = 20;
const MAX_TILE_SIZE = 120;
const MIN_LINE_WIDTH_RATIO = 0.04;
const MAX_LINE_WIDTH_RATIO = 0.4;

/** Canvas background used in dark theme and when theme is not yet resolved. */
const DARK_CANVAS_BG = "#0d0d14";
/** Canvas background used in light theme. */
const LIGHT_CANVAS_BG = "#f5f5f0";

/**
 * Named color pairs from the Okabe-Ito palette (protanopia-safe).
 * Each entry labels a pair of cbColor indices [a, b].
 * "blue-orange" reproduces the original default behavior.
 */
const COLOR_SCHEMES = [
  { id: "blue-orange", label: "Blue / Orange", idxA: 0, idxB: 1 },
  { id: "blue-yellow", label: "Blue / Yellow", idxA: 0, idxB: 3 },
  { id: "purple-green", label: "Purple / Green", idxA: 4, idxB: 2 },
  { id: "sky-vermillion", label: "Sky / Vermillion", idxA: 0, idxB: 5 },
] as const;

type ColorSchemeId = (typeof COLOR_SCHEMES)[number]["id"];

const TILE_STYLES: { id: TileStyle; label: string }[] = [
  { id: "arcs", label: "Arcs" },
  { id: "diagonals", label: "Diagonals" },
  { id: "wedges", label: "Wedges" },
];

function randomSeedString(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Returns a colorblind-safe pair for the selected scheme + theme.
 * Falls back to indices 0, 1 if the scheme id is not found.
 */
function buildPalette(
  theme: "light" | "dark" | undefined,
  schemeId: ColorSchemeId,
): [string, string] {
  const scheme = COLOR_SCHEMES.find((s) => s.id === schemeId) ?? COLOR_SCHEMES[0];
  return [cbColor(scheme.idxA, theme), cbColor(scheme.idxB, theme)];
}

function drawTiling(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number,
  seed: string,
  canvasBg: string,
  theme: "light" | "dark" | undefined,
  schemeId: ColorSchemeId,
  tileStyle: TileStyle,
  lineWidthRatio: number,
): void {
  ctx.fillStyle = canvasBg;
  ctx.fillRect(0, 0, width, height);

  const { cols, rows } = gridDimensions(width, height, tileSize);
  const rng = makeRng(seed);
  const grid = tileGrid(rng, cols, rows);
  const [colorA, colorB] = buildPalette(theme, schemeId);
  const lineWidth = Math.max(2, tileSize * lineWidthRatio);

  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = 0; c < cols; c++) {
      const orientation = row[c];
      if (orientation === undefined) continue;
      drawTileStyled(
        ctx,
        c * tileSize,
        r * tileSize,
        tileSize,
        orientation,
        colorA,
        colorB,
        lineWidth,
        tileStyle,
      );
    }
  }
}

export default function SeededTilingsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState<string>(() => randomSeedString());
  const [tileSize, setTileSize] = useState<number>(DEFAULT_TILE_SIZE);
  const [schemeId, setSchemeId] = useState<ColorSchemeId>("blue-orange");
  const [tileStyle, setTileStyle] = useState<TileStyle>("arcs");
  const [lineWidthRatio, setLineWidthRatio] = useState<number>(DEFAULT_LINE_WIDTH_RATIO);
  const { resolvedTheme } = useTheme();

  const theme = resolvedTheme === "light" ? "light" : resolvedTheme === "dark" ? "dark" : undefined;
  const canvasBg = theme === "light" ? LIGHT_CANVAS_BG : DARK_CANVAS_BG;

  const redraw = useCallback(
    (
      canvas: HTMLCanvasElement,
      currentSeed: string,
      currentTileSize: number,
      bg: string,
      currentTheme: "light" | "dark" | undefined,
      currentScheme: ColorSchemeId,
      currentStyle: TileStyle,
      currentLineWidthRatio: number,
    ) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      drawTiling(
        ctx,
        w,
        h,
        currentTileSize,
        currentSeed,
        bg,
        currentTheme,
        currentScheme,
        currentStyle,
        currentLineWidthRatio,
      );
    },
    [],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    redraw(cv, seed, tileSize, canvasBg, theme, schemeId, tileStyle, lineWidthRatio);

    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      redraw(canvas, seed, tileSize, canvasBg, theme, schemeId, tileStyle, lineWidthRatio);
    });

    ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, tileSize, canvasBg, theme, schemeId, tileStyle, lineWidthRatio, redraw]);

  function handleReroll() {
    setSeed(randomSeedString());
  }

  function handleTileSize(e: React.ChangeEvent<HTMLInputElement>) {
    setTileSize(Number(e.target.value));
  }

  function handleScheme(e: React.ChangeEvent<HTMLSelectElement>) {
    setSchemeId(e.target.value as ColorSchemeId);
  }

  function handleTileStyle(e: React.ChangeEvent<HTMLSelectElement>) {
    setTileStyle(e.target.value as TileStyle);
  }

  function handleLineWidth(e: React.ChangeEvent<HTMLInputElement>) {
    setLineWidthRatio(Number(e.target.value));
  }

  const tileSizeLabelId = "tile-size-label";
  const lineWidthLabelId = "line-width-label";

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const selectClass =
    "rounded border border-border bg-background text-xs text-foreground/70 px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="seeded-tilings"
      title="Seeded Tilings"
      visualLabel="Seeded Truchet tile pattern canvas"
      animated={false}
      controls={
        <>
          {/* Color scheme */}
          <div className="flex items-center gap-2">
            <label htmlFor="color-scheme" className="sr-only">
              Color scheme
            </label>
            <select
              id="color-scheme"
              value={schemeId}
              onChange={handleScheme}
              className={selectClass}
              aria-label="Color scheme"
            >
              {COLOR_SCHEMES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tile style */}
          <div className="flex items-center gap-2">
            <label htmlFor="tile-style" className="sr-only">
              Tile style
            </label>
            <select
              id="tile-style"
              value={tileStyle}
              onChange={handleTileStyle}
              className={selectClass}
              aria-label="Tile style"
            >
              {TILE_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tile size */}
          <div className="flex items-center gap-2">
            <span id={tileSizeLabelId} className="text-xs text-foreground/70">
              size
            </span>
            <input
              type="range"
              min={MIN_TILE_SIZE}
              max={MAX_TILE_SIZE}
              value={tileSize}
              onChange={handleTileSize}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={tileSizeLabelId}
              aria-valuemin={MIN_TILE_SIZE}
              aria-valuemax={MAX_TILE_SIZE}
              aria-valuenow={tileSize}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {tileSize}
            </span>
          </div>

          {/* Line width */}
          <div className="flex items-center gap-2">
            <span id={lineWidthLabelId} className="text-xs text-foreground/70">
              stroke
            </span>
            <input
              type="range"
              min={MIN_LINE_WIDTH_RATIO}
              max={MAX_LINE_WIDTH_RATIO}
              step={0.01}
              value={lineWidthRatio}
              onChange={handleLineWidth}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={lineWidthLabelId}
              aria-valuemin={MIN_LINE_WIDTH_RATIO}
              aria-valuemax={MAX_LINE_WIDTH_RATIO}
              aria-valuenow={lineWidthRatio}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {Math.round(lineWidthRatio * 100)}%
            </span>
          </div>

          <button
            type="button"
            onClick={handleReroll}
            className={btnClass}
            aria-label="Regenerate with a new random seed"
          >
            Re-roll
          </button>
        </>
      }
      attribution={
        <>
          Technique: seeded Truchet tiles with arc rendering. Original concept by{" "}
          <a
            href="https://en.wikipedia.org/wiki/Truchet_tiles"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Sebastien Truchet (1704)
          </a>
          .
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Truchet tile pattern. Use the Re-roll button to generate a new pattern, or adjust the controls to change tile size, stroke weight, color scheme, and tile style."
        suppressHydrationWarning
        style={{ background: canvasBg }}
      />
    </PlayShell>
  );
}
