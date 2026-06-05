"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { hslString, hsl } from "@/lib/creative/color";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import {
  epicycleArms,
  buildWaveTerms,
  totalAmplitude,
  DEFAULT_HARMONICS,
  type Term,
  type WaveformType,
} from "../epicycles";

/** How many seconds to complete one full trace cycle at speed = 1. */
const BASE_CYCLE_SECONDS = 6;

/** Maximum number of path points to keep (caps memory on long sessions). */
const MAX_PATH_POINTS = 1200;

const MIN_HARMONICS = 1;
const MAX_HARMONICS = 60;
const MIN_SPEED = 0.25;
const MAX_SPEED = 4;

/** Device-pixel-ratio-aware canvas dimensions. */
type CanvasSize = { cssW: number; cssH: number; dpr: number };

/**
 * Draws the chain of epicycle arms and the growing traced path.
 *
 * Dark theme: dark background, light circle outlines, bright cyan trace.
 * Light theme: white background, dark circle outlines, deep blue trace.
 */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  t: number,
  path: Array<{ x: number; y: number }>,
  theme: "dark" | "light",
  terms: readonly Term[],
): void {
  const { cssW, cssH, dpr } = size;
  const W = cssW * dpr;
  const H = cssH * dpr;

  // --- background ---
  ctx.fillStyle = theme === "dark" ? "#0a0a0f" : "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Center the coordinate system in the canvas.
  ctx.save();
  ctx.translate(W / 2, H / 2);

  // Scale so the largest circle comfortably fits; leave 10% margin each side.
  const maxRadius = totalAmplitude(terms);
  const fitRadius = (Math.min(W, H) / 2) * 0.82;
  const scale = maxRadius > 0 ? fitRadius / maxRadius : 1;

  ctx.scale(scale, scale);

  const arms = epicycleArms(terms, t);

  // --- draw circles and arms ---
  const circleColor = theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";
  const armColor = theme === "dark" ? "rgba(255,255,255,0.55)" : "rgba(30,30,60,0.65)";
  const pivotColor = theme === "dark" ? "rgba(255,255,255,0.70)" : "rgba(30,30,60,0.80)";

  let prevX = 0;
  let prevY = 0;

  for (let i = 0; i < arms.length; i++) {
    const arm = arms[i];
    if (!arm) continue;
    const term = terms[i];
    if (!term) continue;

    // Circle outline.
    ctx.beginPath();
    ctx.arc(prevX, prevY, term.amp, 0, Math.PI * 2);
    ctx.strokeStyle = circleColor;
    ctx.lineWidth = 1 / scale;
    ctx.stroke();

    // Arm line from previous pivot to this arm's tip.
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(arm.x, arm.y);
    ctx.strokeStyle = armColor;
    ctx.lineWidth = 1.5 / scale;
    ctx.stroke();

    // Pivot dot.
    ctx.beginPath();
    ctx.arc(prevX, prevY, 2.5 / scale, 0, Math.PI * 2);
    ctx.fillStyle = pivotColor;
    ctx.fill();

    prevX = arm.x;
    prevY = arm.y;
  }

  // Tip dot.
  const tipColor = theme === "dark" ? hslString(hsl(185, 1, 0.6)) : hslString(hsl(220, 0.9, 0.4));
  ctx.beginPath();
  ctx.arc(prevX, prevY, 3.5 / scale, 0, Math.PI * 2);
  ctx.fillStyle = tipColor;
  ctx.fill();

  ctx.restore();

  // --- draw traced path in canvas coords (already scaled) ---
  if (path.length < 2) return;

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);

  ctx.beginPath();
  const first = path[0];
  if (first) {
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < path.length; i++) {
      const pt = path[i];
      if (pt) ctx.lineTo(pt.x, pt.y);
    }
  }

  const traceColor =
    theme === "dark" ? hslString(hsl(185, 1, 0.62)) : hslString(hsl(220, 0.85, 0.38));
  ctx.strokeStyle = traceColor;
  ctx.lineWidth = 2 / scale;
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.restore();
}

export default function FourierEpicyclesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<Array<{ x: number; y: number }>>([]);
  const [size, setSize] = useState<CanvasSize | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const [harmonics, setHarmonics] = useState<number>(DEFAULT_HARMONICS);
  const [speed, setSpeed] = useState<number>(1);
  const [waveform, setWaveform] = useState<WaveformType>("square");

  const { resolvedTheme } = useTheme();
  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";

  // Recompute terms whenever waveform or harmonic count changes.
  const terms = useMemo(() => buildWaveTerms(waveform, harmonics), [waveform, harmonics]);

  // DPR-aware ResizeObserver: sets physical canvas dimensions.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      const dpr = window.devicePixelRatio ?? 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      setSize({ cssW, cssH, dpr });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Clear the path on reset, waveform change, or harmonic count change.
  useEffect(() => {
    pathRef.current = [];
  }, [resetKey, waveform, harmonics]);

  const cycleSeconds = BASE_CYCLE_SECONDS / speed;

  useAnimationFrame(
    useCallback(
      ({ t }: { t: number }) => {
        const canvas = canvasRef.current;
        if (!canvas || !size) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Normalized time in [0, 1) cycling every cycleSeconds.
        const normalized = (t % cycleSeconds) / cycleSeconds;

        // Accumulate path, capped to MAX_PATH_POINTS.
        const tip = epicycleArms(terms, normalized);
        const lastArm = tip[tip.length - 1];
        if (lastArm) {
          pathRef.current.push({ x: lastArm.x, y: lastArm.y });
          if (pathRef.current.length > MAX_PATH_POINTS) {
            pathRef.current.splice(0, pathRef.current.length - MAX_PATH_POINTS);
          }
        }

        drawFrame(ctx, size, normalized, pathRef.current, theme, terms);
      },
      [size, theme, terms, cycleSeconds],
    ),
    { reducedMotionFrames: 120 },
  );

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  const handleHarmonics = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHarmonics(Number(e.target.value));
  }, []);

  const handleSpeed = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(Number(e.target.value));
  }, []);

  const handleWaveform = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setWaveform(e.target.value as WaveformType);
  }, []);

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const harmonicsLabelId = "harmonics-label";
  const speedLabelId = "speed-label";

  const waveformLabels: Record<WaveformType, string> = {
    square: "Square",
    sawtooth: "Sawtooth",
    triangle: "Triangle",
  };

  return (
    <PlayShell
      slug="fourier-epicycles"
      title="Fourier Epicycles"
      visualLabel="Rotating circles of decreasing size trace a waveform via Fourier series"
      controls={
        <>
          <div className="flex items-center gap-2">
            <label htmlFor="waveform-select" className="sr-only">
              Waveform
            </label>
            <span className="text-xs text-foreground/70" aria-hidden="true">
              wave
            </span>
            <select
              id="waveform-select"
              value={waveform}
              onChange={handleWaveform}
              className="text-xs rounded border border-border bg-background text-foreground/70 px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {(["square", "sawtooth", "triangle"] as WaveformType[]).map((w) => (
                <option key={w} value={w}>
                  {waveformLabels[w]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span id={harmonicsLabelId} className="text-xs text-foreground/70">
              terms
            </span>
            <input
              type="range"
              min={MIN_HARMONICS}
              max={MAX_HARMONICS}
              value={harmonics}
              onChange={handleHarmonics}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={harmonicsLabelId}
              aria-valuemin={MIN_HARMONICS}
              aria-valuemax={MAX_HARMONICS}
              aria-valuenow={harmonics}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">
              {harmonics}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span id={speedLabelId} className="text-xs text-foreground/70">
              speed
            </span>
            <input
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={0.25}
              value={speed}
              onChange={handleSpeed}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={speedLabelId}
              aria-valuemin={MIN_SPEED}
              aria-valuemax={MAX_SPEED}
              aria-valuenow={speed}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">{speed}x</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className={btnClass}
            aria-label="Reset the traced path"
          >
            Reset
          </button>
        </>
      }
      attribution={
        <>
          Fourier series approximation using {harmonics} harmonic
          {harmonics === 1 ? "" : "s"} of a {waveformLabels[waveform].toLowerCase()} wave.
          Mathematics by{" "}
          <a
            href="https://en.wikipedia.org/wiki/Fourier_series"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Joseph Fourier
          </a>
          . Each circle is one frequency component.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated chain of rotating circles tracing a waveform shape using Fourier series."
      />
    </PlayShell>
  );
}
