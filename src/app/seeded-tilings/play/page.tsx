"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { makeRng } from "@/lib/creative/random";
import { tileGrid, gridDimensions, drawTile } from "../tiling";

const DEFAULT_TILE_SIZE = 60;
const LINE_WIDTH_RATIO = 0.12;
const MIN_TILE_SIZE = 20;
const MAX_TILE_SIZE = 120;

/** Canvas background used in dark theme and when theme is not yet resolved. */
const DARK_CANVAS_BG = "#0d0d14";
/** Canvas background used in light theme. */
const LIGHT_CANVAS_BG = "#f5f5f0";

function randomSeedString(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Returns a pair of colorblind-safe arc colors tuned for the active theme.
 * Uses cbColor(0) and cbColor(1) from the Okabe-Ito palette, which separate
 * on the blue/orange axis — safe for protanopia and deuteranopia.
 */
function buildPalette(theme: "light" | "dark" | undefined): [string, string] {
  return [cbColor(0, theme), cbColor(1, theme)];
}

function drawTiling(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number,
  seed: string,
  canvasBg: string,
  theme: "light" | "dark" | undefined,
): void {
  ctx.fillStyle = canvasBg;
  ctx.fillRect(0, 0, width, height);

  const { cols, rows } = gridDimensions(width, height, tileSize);
  const rng = makeRng(seed);
  const grid = tileGrid(rng, cols, rows);
  const [colorA, colorB] = buildPalette(theme);
  const lineWidth = Math.max(2, tileSize * LINE_WIDTH_RATIO);

  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = 0; c < cols; c++) {
      const orientation = row[c];
      if (orientation === undefined) continue;
      drawTile(ctx, c * tileSize, r * tileSize, tileSize, orientation, colorA, colorB, lineWidth);
    }
  }
}

export default function SeededTilingsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState<string>(() => randomSeedString());
  const [tileSize, setTileSize] = useState<number>(DEFAULT_TILE_SIZE);
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
    ) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      drawTiling(ctx, w, h, currentTileSize, currentSeed, bg, currentTheme);
    },
    [],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    redraw(cv, seed, tileSize, canvasBg, theme);

    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      redraw(canvas, seed, tileSize, canvasBg, theme);
    });

    ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, tileSize, canvasBg, theme, redraw]);

  function handleReroll() {
    setSeed(randomSeedString());
  }

  function handleTileSize(e: React.ChangeEvent<HTMLInputElement>) {
    setTileSize(Number(e.target.value));
  }

  const tileSizeLabelId = "tile-size-label";

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="seeded-tilings"
      title="Seeded Tilings"
      visualLabel="Seeded Truchet tile pattern canvas"
      controls={
        <>
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
        aria-label="Truchet tile pattern. Use the Re-roll button to generate a new pattern, or adjust the size slider to change tile size."
        style={{ background: canvasBg }}
      />
    </PlayShell>
  );
}
