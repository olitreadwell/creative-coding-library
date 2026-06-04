"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { hsl, hslString } from "@/lib/creative/color";
import { makeRng } from "@/lib/creative/random";
import { tileGrid, gridDimensions, drawTile } from "./tiling";

const DEFAULT_TILE_SIZE = 60;
const LINE_WIDTH_RATIO = 0.12;
const MIN_TILE_SIZE = 20;
const MAX_TILE_SIZE = 120;
const BACKGROUND = "#0d0d14";

function randomSeedString(): string {
  return Math.random().toString(36).slice(2, 10);
}

function buildPalette(seed: string): [string, string] {
  const rng = makeRng(seed + "-palette");
  const baseHue = rng() * 360;
  const complementHue = (baseHue + 150 + rng() * 60) % 360;
  const colorA = hslString(hsl(baseHue, 0.75, 0.62));
  const colorB = hslString(hsl(complementHue, 0.7, 0.58));
  return [colorA, colorB];
}

function drawTiling(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number,
  seed: string,
): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  const { cols, rows } = gridDimensions(width, height, tileSize);
  const rng = makeRng(seed);
  const grid = tileGrid(rng, cols, rows);
  const [colorA, colorB] = buildPalette(seed);
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

  const redraw = useCallback(
    (canvas: HTMLCanvasElement, currentSeed: string, currentTileSize: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      drawTiling(ctx, w, h, currentTileSize, currentSeed);
    },
    [],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    redraw(cv, seed, tileSize);

    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      redraw(canvas, seed, tileSize);
    });

    ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, tileSize, redraw]);

  function handleReroll() {
    setSeed(randomSeedString());
  }

  function handleTileSize(e: React.ChangeEvent<HTMLInputElement>) {
    setTileSize(Number(e.target.value));
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
        <h1 className="text-sm font-medium tracking-wide text-white/80">Seeded Tilings</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-white/50">
            <span>size</span>
            <input
              type="range"
              min={MIN_TILE_SIZE}
              max={MAX_TILE_SIZE}
              value={tileSize}
              onChange={handleTileSize}
              className="w-24 accent-white/60"
              aria-label="Tile size"
            />
            <span className="w-8 text-right">{tileSize}</span>
          </label>
          <button
            type="button"
            onClick={handleReroll}
            className="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/50 text-white/70 hover:text-white transition-colors"
            aria-label="Regenerate with a new random seed"
          >
            Re-roll
          </button>
        </div>
      </header>

      <section className="flex-1 relative" aria-label="Seeded Truchet tile pattern">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
          style={{ background: BACKGROUND }}
        />
      </section>

      <footer className="px-6 py-4 text-xs text-white/30 border-t border-white/10">
        Technique: seeded Truchet tiles with arc rendering. Original concept by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Truchet_tiles"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-white/60"
        >
          Sebastien Truchet (1704)
        </a>
        .
      </footer>
    </main>
  );
}
