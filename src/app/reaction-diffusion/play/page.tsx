"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp } from "@/lib/creative";
import { clamp } from "@/lib/creative/math";
import { hslToRgb } from "@/lib/creative/color";
import { makeGrid, step, PRESETS } from "../grayscott";
import type { GrayScottGrid, GrayScottParams } from "../grayscott";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";

// Simulation grid size. Deliberately modest so multiple steps/frame stay fast.
const SIM_W = 200;
const SIM_H = 150;

// Lookup table size for the cbRamp -> RGBA precomputation.
const LUT_SIZE = 256;

// Slider bounds for steps per frame.
const MIN_STEPS = 1;
const MAX_STEPS = 30;
const DEFAULT_STEPS = 6;

// Brush size bounds in simulation-grid cells.
const MIN_BRUSH = 2;
const MAX_BRUSH = 20;
const DEFAULT_BRUSH = 6;

/**
 * Named presets shown in the pattern select.
 * feed/kill values from Pearson (1993) and the Karl Sims / Robert Munafo
 * parameter maps. Each preset produces a visually distinct settled morphology,
 * which matters for the reduced-motion synchronous path.
 */
const PATTERN_PRESETS: Array<{ label: string; params: GrayScottParams }> = [
  { label: "Spots / Bubbles", params: PRESETS.spots },
  { label: "Coral", params: { dA: 1.0, dB: 0.5, feed: 0.0545, kill: 0.062 } },
  { label: "Mitosis", params: { dA: 1.0, dB: 0.5, feed: 0.028, kill: 0.051 } },
  { label: "Maze", params: { dA: 1.0, dB: 0.5, feed: 0.029, kill: 0.057 } },
  { label: "Worms", params: PRESETS.stripes },
];

const DEFAULT_PRESET_INDEX = 0;

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

/**
 * Seeds a circular patch of chemical B (and zeroes A) at grid coordinates
 * (cx, cy) with the given radius. Mutates the grid arrays in place.
 */
function seedBrush(grid: GrayScottGrid, cx: number, cy: number, radius: number): void {
  const { a, b, width, height } = grid;
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.round(cx - radius));
  const x1 = Math.min(width - 1, Math.round(cx + radius));
  const y0 = Math.max(0, Math.round(cy - radius));
  const y1 = Math.min(height - 1, Math.round(cy + radius));

  for (let gy = y0; gy <= y1; gy++) {
    for (let gx = x0; gx <= x1; gx++) {
      const dx = gx - cx;
      const dy = gy - cy;
      if (dx * dx + dy * dy <= r2) {
        const idx = gy * width + gx;
        a[idx] = 0.0;
        b[idx] = 1.0;
      }
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

  // Params ref so the animation loop always reads the latest preset without
  // recreating the callback.
  const paramsRef = useRef<GrayScottParams>(
    PATTERN_PRESETS[DEFAULT_PRESET_INDEX]?.params ?? PRESETS.spots,
  );

  // Steps per frame ref, same reason.
  const stepsPerFrameRef = useRef<number>(DEFAULT_STEPS);

  const [seed, setSeed] = useState<number>(() => Date.now());
  const [presetIndex, setPresetIndex] = useState<number>(DEFAULT_PRESET_INDEX);
  const [stepsPerFrame, setStepsPerFrame] = useState<number>(DEFAULT_STEPS);
  const [brushSize, setBrushSize] = useState<number>(DEFAULT_BRUSH);

  const brushSizeRef = useRef<number>(DEFAULT_BRUSH);

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

  // Re-seed the grid whenever the seed changes. Pull current params from ref
  // so a preset+reset combo works in a single render cycle.
  useEffect(() => {
    gridRef.current = makeGrid(SIM_W, SIM_H, seed);
  }, [seed]);

  // Keep the params ref in sync with the selected preset.
  useEffect(() => {
    const preset = PATTERN_PRESETS[presetIndex];
    if (preset) {
      paramsRef.current = preset.params;
    }
  }, [presetIndex]);

  // Keep the steps-per-frame ref in sync.
  useEffect(() => {
    stepsPerFrameRef.current = stepsPerFrame;
  }, [stepsPerFrame]);

  // Keep brush size ref in sync.
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

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
      const steps = stepsPerFrameRef.current;
      for (let s = 0; s < steps; s++) {
        const next = step(a, b, width, height, paramsRef.current);
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
    // Reduced motion: the pattern only emerges after many steps, so compose a
    // settled still synchronously rather than showing the blank seed frame.
    { pauseWhenHidden: true, reducedMotionFrames: 400 },
  );

  // Pointer drawing: convert canvas client coords to grid coords and seed B.
  const isPainting = useRef(false);

  const canvasToGrid = useCallback(
    (canvas: HTMLCanvasElement, clientX: number, clientY: number): { gx: number; gy: number } => {
      const rect = canvas.getBoundingClientRect();
      const fx = (clientX - rect.left) / rect.width;
      const fy = (clientY - rect.top) / rect.height;
      return {
        gx: clamp(fx * SIM_W, 0, SIM_W - 1),
        gy: clamp(fy * SIM_H, 0, SIM_H - 1),
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      isPainting.current = true;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      const { gx, gy } = canvasToGrid(e.currentTarget, e.clientX, e.clientY);
      seedBrush(gridRef.current, gx, gy, brushSizeRef.current);
    },
    [canvasToGrid],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isPainting.current) return;
      const { gx, gy } = canvasToGrid(e.currentTarget, e.clientX, e.clientY);
      seedBrush(gridRef.current, gx, gy, brushSizeRef.current);
    },
    [canvasToGrid],
  );

  const handlePointerUp = useCallback(() => {
    isPainting.current = false;
  }, []);

  const handleReset = useCallback(() => {
    setSeed(freshSeed());
  }, []);

  const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    setPresetIndex(idx);
    // Apply preset params immediately to the ref so the next frame uses them,
    // then reset the grid so the new morphology emerges from a clean state.
    const preset = PATTERN_PRESETS[idx];
    if (preset) {
      paramsRef.current = preset.params;
    }
    setSeed(freshSeed());
  }, []);

  const handleStepsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setStepsPerFrame(v);
    stepsPerFrameRef.current = v;
  }, []);

  const handleBrushChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setBrushSize(v);
    brushSizeRef.current = v;
  }, []);

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const presetSelectId = "rd-preset-select";
  const speedLabelId = "rd-speed-label";
  const brushLabelId = "rd-brush-label";

  return (
    <PlayShell
      slug="reaction-diffusion"
      title="Reaction Diffusion"
      visualLabel="Gray-Scott reaction-diffusion simulation. Patterns evolve in real time. Click or drag on the canvas to seed chemical B."
      controls={
        <>
          {/* Pattern preset */}
          <div className="flex items-center gap-2">
            <label htmlFor={presetSelectId} className="sr-only">
              Pattern preset
            </label>
            <select
              id={presetSelectId}
              value={presetIndex}
              onChange={handlePresetChange}
              className="text-sm rounded border border-border bg-background text-foreground/70 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PATTERN_PRESETS.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-2">
            <span id={speedLabelId} className="text-xs text-foreground/70">
              speed
            </span>
            <input
              type="range"
              min={MIN_STEPS}
              max={MAX_STEPS}
              value={stepsPerFrame}
              onChange={handleStepsChange}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={speedLabelId}
              aria-valuemin={MIN_STEPS}
              aria-valuemax={MAX_STEPS}
              aria-valuenow={stepsPerFrame}
            />
            <span className="w-5 text-right text-xs text-foreground/70 tabular-nums">
              {stepsPerFrame}
            </span>
          </div>

          {/* Brush size slider */}
          <div className="flex items-center gap-2">
            <span id={brushLabelId} className="text-xs text-foreground/70">
              brush
            </span>
            <input
              type="range"
              min={MIN_BRUSH}
              max={MAX_BRUSH}
              value={brushSize}
              onChange={handleBrushChange}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={brushLabelId}
              aria-valuemin={MIN_BRUSH}
              aria-valuemax={MAX_BRUSH}
              aria-valuenow={brushSize}
            />
            <span className="w-5 text-right text-xs text-foreground/70 tabular-nums">
              {brushSize}
            </span>
          </div>

          {/* Reset */}
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
        aria-label="Animated Gray-Scott reaction-diffusion pattern. Click or drag to seed chemical B and grow new structures. Use the preset select, speed, and brush controls to change the simulation."
        style={{ imageRendering: "pixelated", cursor: "crosshair" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </PlayShell>
  );
}
