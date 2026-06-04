"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { hsl, hslString } from "@/lib/creative/color";
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

function buildPalette(seed: string, isLight: boolean): [string, string] {
  const rng = makeRng(seed + "-palette");
  const baseHue = rng() * 360;
  const complementHue = (baseHue + 150 + rng() * 60) % 360;
  // Dark theme: bright arcs at higher lightness pop on the dark canvas.
  // Light theme: deeper, more saturated arcs at lower lightness for clear
  // contrast against the near-white canvas (targets >= 3:1 on #f5f5f0).
  const [satA, litA, satB, litB] = isLight ? [0.85, 0.35, 0.8, 0.32] : [0.75, 0.62, 0.7, 0.58];
  const colorA = hslString(hsl(baseHue, satA, litA));
  const colorB = hslString(hsl(complementHue, satB, litB));
  return [colorA, colorB];
}

function drawTiling(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number,
  seed: string,
  canvasBg: string,
  isLight: boolean,
): void {
  ctx.fillStyle = canvasBg;
  ctx.fillRect(0, 0, width, height);

  const { cols, rows } = gridDimensions(width, height, tileSize);
  const rng = makeRng(seed);
  const grid = tileGrid(rng, cols, rows);
  const [colorA, colorB] = buildPalette(seed, isLight);
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
  const [seed, setSeed] = useState<string>("truchet");
  const [tileSize, setTileSize] = useState<number>(DEFAULT_TILE_SIZE);
  const { resolvedTheme } = useTheme();

  const canvasBg = resolvedTheme === "light" ? LIGHT_CANVAS_BG : DARK_CANVAS_BG;

  const isLight = resolvedTheme === "light";

  const redraw = useCallback(
    (
      canvas: HTMLCanvasElement,
      currentSeed: string,
      currentTileSize: number,
      bg: string,
      light: boolean,
    ) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      drawTiling(ctx, w, h, currentTileSize, currentSeed, bg, light);
    },
    [],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    redraw(cv, seed, tileSize, canvasBg, isLight);

    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      redraw(canvas, seed, tileSize, canvasBg, isLight);
    });

    ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, tileSize, canvasBg, isLight, redraw]);

  function handleReroll() {
    setSeed(randomSeedString());
  }

  function handleTileSize(e: React.ChangeEvent<HTMLInputElement>) {
    setTileSize(Number(e.target.value));
  }

  const tileSizeLabelId = "tile-size-label";

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-y-2 justify-between border-b border-border shrink-0">
        <nav aria-label="Page navigation">
          <Link
            href="/seeded-tilings"
            aria-label="Back to Seeded Tilings"
            className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide text-foreground/80 order-first sm:order-none w-full sm:w-auto text-center">
          Seeded Tilings
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
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
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-white/70"
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
            className="text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-white/70"
            aria-label="Regenerate with a new random seed"
          >
            Re-roll
          </button>
        </div>
      </header>

      <section className="flex-1 relative" aria-label="Seeded Truchet tile canvas">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="Truchet tile pattern. Use the Re-roll button to generate a new pattern, or adjust the size slider to change tile size."
          style={{ background: canvasBg }}
        />
      </section>

      <footer className="px-4 sm:px-6 py-4 text-xs text-foreground/70 border-t border-border shrink-0">
        Technique: seeded Truchet tiles with arc rendering. Original concept by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Truchet_tiles"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sebastien Truchet (1704)
        </a>
        .
      </footer>
    </main>
  );
}
