"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { hsl, hslToRgb } from "@/lib/creative/color";
import { clamp, map } from "@/lib/creative/math";
import { mandelEscape, pixelToComplex } from "../fractal";
import type { View } from "../fractal";

const MAX_ITER = 256;

const DEFAULT_VIEW: View = { centerX: -0.6, centerY: 0, span: 3.5 };

/** Cap render resolution so the per-pixel loop stays fast on large screens. */
const MAX_RENDER_PX = 1200;

/**
 * Maps a smooth escape count to an RGBA pixel color.
 *
 * Dark theme: points in the set are black, escaping points use vivid cyclic hues
 * with mid-range lightness so colors pop on a dark background.
 *
 * Light theme: points in the set are near-black (so the set reads clearly on
 * white), escaping points use deeper, more saturated hues at lower lightness so
 * the escape bands stay legible against a light background rather than washing out.
 */
function escapeToRgba(
  t: number,
  maxIter: number,
  theme: "dark" | "light",
): [number, number, number, number] {
  if (t >= maxIter) {
    // Dark: classic black set. Light: very dark navy so the set reads clearly.
    return theme === "light" ? [15, 15, 30, 255] : [0, 0, 0, 255];
  }

  const normalized = t / maxIter;
  // Cycle the hue multiple times for a rich, banded palette.
  const hue = (normalized * 360 * 6) % 360;

  if (theme === "light") {
    // Deeper saturation, lower lightness ceiling so bands stay vivid on white.
    const saturation = 1.0;
    const lightness = clamp(0.12 + normalized * 0.45, 0.12, 0.58);
    const { r, g, b } = hslToRgb(hsl(hue, saturation, lightness));
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
  }

  // Dark theme: keep the original vivid coloring.
  const saturation = 0.9;
  const lightness = clamp(0.08 + normalized * 0.65, 0.08, 0.72);
  const { r, g, b } = hslToRgb(hsl(hue, saturation, lightness));
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
}

/**
 * Renders the Mandelbrot set into `imageData` for the given view.
 * Operates purely on the buffer — no canvas API calls.
 */
function renderMandelbrot(imageData: ImageData, view: View, theme: "dark" | "light"): void {
  const { width, height, data } = imageData;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const { x: cx, y: cy } = pixelToComplex(px, py, width, height, view);
      const t = mandelEscape(cx, cy, MAX_ITER);
      const [r, g, b, a] = escapeToRgba(t, MAX_ITER, theme);
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

/** Deepest zoom before double precision breaks down. */
const MIN_SPAN = 1e-13;

/** Re-centers on (cx, cy) and scales the span by `factor` (<1 in, >1 out). */
function zoomAt(view: View, cx: number, cy: number, factor: number): View {
  return {
    centerX: cx,
    centerY: cy,
    span: clamp(view.span * factor, MIN_SPAN, DEFAULT_VIEW.span),
  };
}

export default function MandelbrotPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  // Holding Alt flips a click from zoom-in to zoom-out; we mirror that in the cursor.
  const [zoomOutMode, setZoomOutMode] = useState(false);

  // next-themes: guard undefined during SSR/hydration, default to "dark".
  const { resolvedTheme } = useTheme();
  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";

  const zoomIn = useCallback(() => {
    setView((v) => zoomAt(v, v.centerX, v.centerY, 0.5));
  }, []);
  const zoomOut = useCallback(() => {
    setView((v) => zoomAt(v, v.centerX, v.centerY, 2));
  }, []);

  // Track the Alt modifier and support +/- keyboard zoom for accessibility.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setZoomOutMode(true);
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOut();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setZoomOutMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [zoomIn, zoomOut]);

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

  // Re-render whenever view, canvas size, or theme changes.
  useEffect(() => {
    if (!size) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(size.w, size.h);
    renderMandelbrot(imageData, view, theme);
    ctx.putImageData(imageData, 0, 0);
  }, [view, size, theme]);

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
      // Alt-click zooms out, plain click zooms in, both recentering on the cursor.
      setView(zoomAt(view, x, y, e.altKey ? 2 : 0.5));
    },
    [view, size],
  );

  const handleReset = useCallback(() => {
    setView(DEFAULT_VIEW);
  }, []);

  const zoom = size ? zoomLevel(view) : 1;

  const btnClass =
    "inline-flex size-8 items-center justify-center rounded border border-border text-foreground/70 hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors";
  const resetBtnClass =
    "text-sm px-3 py-1 rounded border border-border text-foreground/70 hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors";

  return (
    <PlayShell
      slug="mandelbrot"
      title="Mandelbrot"
      visualLabel="Mandelbrot set; click to zoom in, Alt-click to zoom out"
      controls={
        <>
          <span
            className="mr-1 text-xs tabular-nums text-foreground/60"
            aria-live="polite"
            aria-label={`Zoom level ${zoom.toFixed(2)}x`}
          >
            {zoom.toFixed(2)}x
          </span>
          <button type="button" onClick={zoomOut} className={btnClass} aria-label="Zoom out">
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={zoomIn} className={btnClass} aria-label="Zoom in">
            <Plus className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={resetBtnClass}
            aria-label="Reset to default view"
          >
            Reset
          </button>
        </>
      }
      attribution={
        <>
          Escape-time algorithm. Original mathematics by{" "}
          <a
            href="https://en.wikipedia.org/wiki/Mandelbrot_set"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Benoit Mandelbrot
          </a>
          . Smooth coloring via the log-log method.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={`absolute inset-0 w-full h-full ${zoomOutMode ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        aria-label="Mandelbrot set canvas. Click to zoom in, hold Alt and click to zoom out. Plus and minus keys also zoom."
        style={{ imageRendering: "pixelated" }}
      />
    </PlayShell>
  );
}
