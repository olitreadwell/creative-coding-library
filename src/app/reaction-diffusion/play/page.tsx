"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp } from "@/lib/creative";
import { clamp } from "@/lib/creative/math";
import { hslToRgb } from "@/lib/creative/color";
import { makeGrid, step, DEFAULT_PARAMS } from "../grayscott";
import type { GrayScottGrid, GrayScottParams } from "../grayscott";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";

// Simulation grid size. Deliberately modest so multiple steps/frame stay fast.
const SIM_W = 200;
const SIM_H = 150;

// Number of Gray-Scott steps to advance per animation frame.
// More steps = pattern evolves faster; fewer = smoother playback.
const STEPS_PER_FRAME = 6;

// Lookup table size for the cbRamp -> RGBA precomputation.
const LUT_SIZE = 256;

const PARAMS: GrayScottParams = DEFAULT_PARAMS;

/** Generates a numeric seed from Date.now so each reset is visually distinct. */
function freshSeed(): number {
  return Date.now();
}

// Matches the hslString() format: "hsl(H S% L% / A)"
const HSL_RE = /hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/;

/**
 * Precomputes a Uint8ClampedArray lookup table (LUT_SIZE * 4 bytes) mapping
 * B-concentration indices to RGBA pixel values.
 *
 * Calls cbRamp(t, theme) for each of LUT_SIZE steps and decodes the returned
 * CSS hsl() string via hslToRgb. The LUT is rebuilt only when the theme changes,
 * so the 256 string parses happen once per theme transition, not per frame.
 */
function buildLut(theme: string | undefined): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(LUT_SIZE * 4);
  const resolvedTheme = theme === "light" ? "light" : "dark";

  for (let i = 0; i < LUT_SIZE; i++) {
    const t = i / (LUT_SIZE - 1);
    const css = cbRamp(t, resolvedTheme);
    const match = HSL_RE.exec(css);

    let r = 0;
    let g = 0;
    let b = 0;

    if (match) {
      const h = parseFloat(match[1] ?? "0");
      const s = parseFloat(match[2] ?? "0") / 100;
      const l = parseFloat(match[3] ?? "0") / 100;
      const rgb = hslToRgb({ h, s, l });
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    }

    const pixIdx = i * 4;
    lut[pixIdx] = Math.round(clamp(r, 0, 1) * 255);
    lut[pixIdx + 1] = Math.round(clamp(g, 0, 1) * 255);
    lut[pixIdx + 2] = Math.round(clamp(b, 0, 1) * 255);
    lut[pixIdx + 3] = 255;
  }

  return lut;
}

/**
 * Writes the current B grid into an ImageData buffer using a precomputed LUT.
 * One simulation cell maps to one pixel in the buffer.
 */
function paintGrid(
  imageData: ImageData,
  b: Float32Array,
  width: number,
  height: number,
  lut: Uint8ClampedArray,
): void {
  const { data } = imageData;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const bVal = clamp(b[idx] ?? 0, 0, 1);
      const lutIdx = Math.round(bVal * (LUT_SIZE - 1)) * 4;
      const pixIdx = idx * 4;
      data[pixIdx] = lut[lutIdx] ?? 0;
      data[pixIdx + 1] = lut[lutIdx + 1] ?? 0;
      data[pixIdx + 2] = lut[lutIdx + 2] ?? 0;
      data[pixIdx + 3] = 255;
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

  // Precomputed LUT rebuilt whenever the theme changes.
  const lutRef = useRef<Uint8ClampedArray>(buildLut(resolvedTheme));
  useEffect(() => {
    lutRef.current = buildLut(resolvedTheme);
  }, [resolvedTheme]);

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

    const fit = (): void => {
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
  useAnimationFrame(
    () => {
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

      // Paint into the offscreen ImageData using the cbRamp-derived LUT.
      const imageData = octx.createImageData(SIM_W, SIM_H);
      paintGrid(imageData, b, SIM_W, SIM_H, lutRef.current);
      octx.putImageData(imageData, 0, 0);

      // Scale up to fill the on-screen canvas.
      const dpr = window.devicePixelRatio ?? 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.drawImage(oc, 0, 0, cssW, cssH);
      ctx.restore();
    },
    { pauseWhenHidden: true, respectReducedMotion: true },
  );

  const handleReset = useCallback(() => {
    setSeed(freshSeed());
  }, []);

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="reaction-diffusion"
      title="Reaction Diffusion"
      visualLabel="Gray-Scott reaction-diffusion simulation. Patterns evolve in real time."
      controls={
        <>
          <button
            type="button"
            onClick={handleReset}
            className={btnClass}
            aria-label="Reset with a new random seed"
          >
            Reset
          </button>
        </>
      }
      attribution={
        <>
          Gray-Scott model. Based on the work of{" "}
          <a
            href="https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Gray &amp; Scott (1984)
          </a>
          . Pattern morphology from Pearson&apos;s 1993 classification.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated Gray-Scott reaction-diffusion pattern. Two virtual chemicals react and diffuse, forming spots and stripes."
        style={{ imageRendering: "pixelated" }}
      />
    </PlayShell>
  );
}
