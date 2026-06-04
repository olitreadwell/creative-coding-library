"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { hsl, hslToRgb } from "@/lib/creative/color";
import { clamp } from "@/lib/creative/math";
import { makeGrid, step, DEFAULT_PARAMS } from "../grayscott";
import type { GrayScottGrid, GrayScottParams } from "../grayscott";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";

// Simulation grid size. Deliberately modest so multiple steps/frame stay fast.
const SIM_W = 200;
const SIM_H = 150;

// Number of Gray-Scott steps to advance per animation frame.
// More steps = pattern evolves faster; fewer = smoother playback.
const STEPS_PER_FRAME = 6;

const PARAMS: GrayScottParams = DEFAULT_PARAMS;

/** Generates a numeric seed from Date.now so each reset is visually distinct. */
function freshSeed(): number {
  return Date.now();
}

/**
 * Maps a B-concentration value to an RGBA pixel color.
 *
 * Dark theme: near-black background, bright warm/cool hues for high B.
 * Light theme: near-white background, deep saturated hues for high B.
 * Both palettes are chosen so the pattern reads clearly at AA contrast.
 */
function bToRgba(bVal: number, theme: "dark" | "light"): [number, number, number, number] {
  const t = clamp(bVal, 0, 1);

  if (theme === "dark") {
    // Low B (background): near-black, slight cool tint.
    // High B (pattern): bright cyan-to-magenta sweep.
    if (t < 0.01) return [5, 8, 12, 255];
    const hue = 180 + t * 140; // cyan (180) through blue to magenta (320)
    const saturation = 0.85;
    const lightness = clamp(0.1 + t * 0.62, 0.1, 0.72);
    const { r, g, b } = hslToRgb(hsl(hue, saturation, lightness));
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
  }

  // Light theme: low B = near-white, high B = deep teal-to-indigo.
  if (t < 0.01) return [248, 250, 252, 255];
  const hue = 190 + t * 120; // teal (190) through blue to indigo (310)
  const saturation = 0.9;
  const lightness = clamp(0.62 - t * 0.48, 0.14, 0.62);
  const { r, g, b } = hslToRgb(hsl(hue, saturation, lightness));
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
}

/**
 * Writes the current B grid into an ImageData buffer.
 * One simulation cell maps to one pixel in the buffer.
 */
function paintGrid(
  imageData: ImageData,
  b: Float32Array,
  width: number,
  height: number,
  theme: "dark" | "light",
): void {
  const { data } = imageData;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const bVal = b[idx] ?? 0;
      const [r, g, blue, a] = bToRgba(bVal, theme);
      const pixIdx = idx * 4;
      data[pixIdx] = r;
      data[pixIdx + 1] = g;
      data[pixIdx + 2] = blue;
      data[pixIdx + 3] = a;
    }
  }
}

export default function ReactionDiffusionPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Offscreen canvas at sim resolution; we scale it up when drawing to the
  // on-screen canvas via drawImage, which gives crisp pixelated rendering.
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Grid state lives in a ref so the animation loop always reads the latest
  // version without the closure going stale.
  const gridRef = useRef<GrayScottGrid>(makeGrid(SIM_W, SIM_H, freshSeed()));

  const [seed, setSeed] = useState<number>(() => Date.now());

  const { resolvedTheme } = useTheme();
  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Build the offscreen canvas once on mount.
  useEffect(() => {
    const oc = document.createElement("canvas");
    oc.width = SIM_W;
    oc.height = SIM_H;
    const ctx = oc.getContext("2d");
    if (!ctx) return;
    offscreenRef.current = oc;
    offscreenCtxRef.current = ctx;
  }, []);

  // Re-seed the grid whenever the seed changes.
  useEffect(() => {
    gridRef.current = makeGrid(SIM_W, SIM_H, seed);
  }, [seed]);

  // Fit the on-screen canvas to its CSS box, DPR-aware.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const dpr = window.devicePixelRatio ?? 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Animation loop: step the sim, paint offscreen, scale to main canvas.
  useAnimationFrame(() => {
    const oc = offscreenRef.current;
    const octx = offscreenCtxRef.current;
    const canvas = canvasRef.current;
    if (!oc || !octx || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Advance simulation.
    let { a, b, width, height } = gridRef.current;
    for (let s = 0; s < STEPS_PER_FRAME; s++) {
      const next = step(a, b, width, height, PARAMS);
      a = next.a;
      b = next.b;
    }
    gridRef.current = { a, b, width, height };

    // Paint into the offscreen ImageData.
    const imageData = octx.createImageData(SIM_W, SIM_H);
    paintGrid(imageData, b, SIM_W, SIM_H, themeRef.current);
    octx.putImageData(imageData, 0, 0);

    // Scale up to fill the on-screen canvas.
    const dpr = window.devicePixelRatio ?? 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.drawImage(oc, 0, 0, cssW, cssH);
    ctx.restore();
  });

  const handleReset = useCallback(() => {
    setSeed(freshSeed());
  }, []);

  const isDark = theme === "dark";

  const pageBg = isDark ? "bg-black text-white" : "bg-background text-foreground";
  const borderCol = isDark ? "border-white/10" : "border-border";
  const mutedText = isDark ? "text-white/70" : "text-foreground/60";
  const headText = isDark ? "text-white/80" : "text-foreground/80";
  const btnCls = isDark
    ? "border-white/25 text-white/80 hover:border-white/60 hover:text-white focus-visible:ring-white/70"
    : "border-border text-foreground/70 hover:border-foreground/50 hover:text-foreground focus-visible:ring-foreground/40";

  return (
    <main className={`min-h-screen flex flex-col ${pageBg}`}>
      <header
        className={`px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b ${borderCol} shrink-0`}
      >
        <nav aria-label="Page navigation">
          <Link
            href="/reaction-diffusion"
            className={`inline-flex items-center gap-1 text-sm ${mutedText} hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/40 rounded`}
            aria-label="Back to Reaction Diffusion detail page"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
        </nav>

        <h1 className={`flex-1 text-sm font-medium tracking-wide ${headText}`}>
          Reaction Diffusion
        </h1>

        <button
          type="button"
          onClick={handleReset}
          className={`text-sm px-3 py-1 rounded border ${btnCls} transition-colors focus-visible:outline-none focus-visible:ring-2`}
          aria-label="Reset with a new random seed"
        >
          Reset
        </button>
      </header>

      <section
        className="flex-1 relative"
        aria-label="Gray-Scott reaction-diffusion simulation. Patterns evolve in real time."
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="Animated Gray-Scott reaction-diffusion pattern. Two virtual chemicals react and diffuse, forming spots and stripes."
          style={{ imageRendering: "pixelated" }}
        />
      </section>

      <footer className={`px-6 py-4 text-xs ${mutedText} border-t ${borderCol} shrink-0`}>
        Gray-Scott model. Based on the work of{" "}
        <a
          href="https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-70"
        >
          Gray &amp; Scott (1984)
        </a>
        . Pattern morphology from Pearson&apos;s 1993 classification.
      </footer>
    </main>
  );
}
