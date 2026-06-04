"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { hsl, hslToRgb } from "@/lib/creative/color";
import { clamp, map } from "@/lib/creative/math";
import { mandelEscape, pixelToComplex } from "./fractal";
import type { View } from "./fractal";

const MAX_ITER = 256;

const DEFAULT_VIEW: View = { centerX: -0.6, centerY: 0, span: 3.5 };

/** Cap render resolution so the per-pixel loop stays fast on large screens. */
const MAX_RENDER_PX = 1200;

/**
 * Maps a smooth escape count to an RGBA pixel color.
 * Points in the set are black. Escaping points get a rich cyclic hue.
 */
function escapeToRgba(t: number, maxIter: number): [number, number, number, number] {
  if (t >= maxIter) return [0, 0, 0, 255];

  // Normalize to [0, 1] and cycle the hue multiple times for a rich palette.
  const normalized = t / maxIter;
  const hue = (normalized * 360 * 6) % 360;
  const saturation = 0.9;
  // Make deep points (high iteration near the set boundary) brighter.
  const lightness = clamp(0.08 + normalized * 0.65, 0.08, 0.72);

  const { r, g, b } = hslToRgb(hsl(hue, saturation, lightness));
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
}

/**
 * Renders the Mandelbrot set into `imageData` for the given view.
 * Operates purely on the buffer — no canvas API calls.
 */
function renderMandelbrot(imageData: ImageData, view: View): void {
  const { width, height, data } = imageData;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const { x: cx, y: cy } = pixelToComplex(px, py, width, height, view);
      const t = mandelEscape(cx, cy, MAX_ITER);
      const [r, g, b, a] = escapeToRgba(t, MAX_ITER);
      const idx = (py * width + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
}

/** Computes a display zoom level relative to the default span. */
function zoomLevel(view: View): number {
  return DEFAULT_VIEW.span / view.span;
}

export default function MandelbrotPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Fit canvas to its CSS box and observe resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;

      // Cap at MAX_RENDER_PX on the longest axis for perf.
      const scale = Math.min(1, MAX_RENDER_PX / Math.max(cssW, cssH));
      const renderW = Math.round(cssW * scale);
      const renderH = Math.round(cssH * scale);

      canvas.width = renderW;
      canvas.height = renderH;
      setSize({ w: renderW, h: renderH });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Re-render whenever view or canvas size changes.
  useEffect(() => {
    if (!size) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(size.w, size.h);
    renderMandelbrot(imageData, view);
    ctx.putImageData(imageData, 0, 0);
  }, [view, size]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !size) return;

      const rect = canvas.getBoundingClientRect();
      // Map CSS click coords to render buffer coords.
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;
      const px = map(cssX, 0, rect.width, 0, size.w);
      const py = map(cssY, 0, rect.height, 0, size.h);

      const { x, y } = pixelToComplex(px, py, size.w, size.h, view);
      setView({ centerX: x, centerY: y, span: view.span / 2 });
    },
    [view, size],
  );

  const handleReset = useCallback(() => {
    setView(DEFAULT_VIEW);
  }, []);

  const zoom = size ? zoomLevel(view) : 1;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white underline underline-offset-2"
          >
            &larr; home
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide text-white/80">Mandelbrot</h1>
        <div className="flex items-center gap-3">
          <span
            className="text-xs tabular-nums text-white/40"
            aria-live="polite"
            aria-label={`Zoom level ${zoom.toFixed(2)}x`}
          >
            {zoom.toFixed(2)}x
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/50 text-white/70 hover:text-white transition-colors"
            aria-label="Reset to default view"
          >
            Reset
          </button>
        </div>
      </header>

      <section className="flex-1 relative" aria-label="Mandelbrot set — click to zoom in">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          aria-label="Mandelbrot set canvas. Click anywhere to zoom into that point."
          style={{ imageRendering: "pixelated" }}
        />
      </section>

      <footer className="px-6 py-4 text-xs text-white/30 border-t border-white/10 shrink-0">
        Escape-time algorithm. Original mathematics by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Mandelbrot_set"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-white/60"
        >
          Benoit Mandelbrot
        </a>
        . Smooth coloring via the log-log method.
      </footer>
    </main>
  );
}
