"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { hslString, hsl } from "@/lib/creative/color";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { epicycleArms, SQUARE_WAVE_TERMS } from "../epicycles";

/** How many seconds to complete one full trace cycle. */
const CYCLE_SECONDS = 6;

/** Maximum number of path points to keep (caps memory on long sessions). */
const MAX_PATH_POINTS = 1200;

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
  const maxRadius = SQUARE_WAVE_TERMS.reduce((s, term) => s + term.amp, 0);
  const fitRadius = (Math.min(W, H) / 2) * 0.82;
  const scale = fitRadius / maxRadius;

  ctx.scale(scale, scale);

  const arms = epicycleArms(SQUARE_WAVE_TERMS, t);

  // --- draw circles and arms ---
  const circleColor = theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";
  const armColor = theme === "dark" ? "rgba(255,255,255,0.55)" : "rgba(30,30,60,0.65)";
  const pivotColor = theme === "dark" ? "rgba(255,255,255,0.70)" : "rgba(30,30,60,0.80)";

  let prevX = 0;
  let prevY = 0;

  for (let i = 0; i < arms.length; i++) {
    const arm = arms[i];
    if (!arm) continue;
    const term = SQUARE_WAVE_TERMS[i];
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

  const { resolvedTheme } = useTheme();
  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";

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

  // Clear the path on reset.
  useEffect(() => {
    pathRef.current = [];
  }, [resetKey]);

  useAnimationFrame(
    useCallback(
      ({ t }: { t: number }) => {
        const canvas = canvasRef.current;
        if (!canvas || !size) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Normalized time in [0, 1) cycling every CYCLE_SECONDS.
        const normalized = (t % CYCLE_SECONDS) / CYCLE_SECONDS;

        // Accumulate path, capped to MAX_PATH_POINTS.
        const tip = epicycleArms(SQUARE_WAVE_TERMS, normalized);
        const lastArm = tip[tip.length - 1];
        if (lastArm) {
          pathRef.current.push({ x: lastArm.x, y: lastArm.y });
          if (pathRef.current.length > MAX_PATH_POINTS) {
            pathRef.current.splice(0, pathRef.current.length - MAX_PATH_POINTS);
          }
        }

        drawFrame(ctx, size, normalized, pathRef.current, theme);
      },
      [size, theme],
    ),
  );

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  const isDark = theme === "dark";
  const pageBg = isDark ? "bg-black text-white" : "bg-background text-foreground";
  const borderColor = isDark ? "border-white/10" : "border-border";
  const mutedText = isDark ? "text-white/70" : "text-foreground/60";
  const headingText = isDark ? "text-white/80" : "text-foreground/80";
  const btnBorder = isDark
    ? "border-white/25 text-white/80 hover:border-white/60 hover:text-white focus-visible:ring-white/70"
    : "border-border text-foreground/70 hover:border-foreground/50 hover:text-foreground focus-visible:ring-foreground/40";

  return (
    <main className={`min-h-screen flex flex-col ${pageBg}`}>
      <header
        className={`px-6 py-4 flex items-center justify-between border-b ${borderColor} shrink-0`}
      >
        <nav aria-label="Page navigation">
          <Link
            href="/fourier-epicycles"
            className={`inline-flex items-center gap-1 text-sm ${mutedText} hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/40 rounded`}
            aria-label="Back to Fourier Epicycles detail page"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
        </nav>

        <h1 className={`text-sm font-medium tracking-wide ${headingText}`}>Fourier Epicycles</h1>

        <button
          type="button"
          onClick={handleReset}
          className={`text-sm px-3 py-1 rounded border ${btnBorder} transition-colors focus-visible:outline-none focus-visible:ring-2`}
          aria-label="Reset the traced path"
        >
          Reset
        </button>
      </header>

      <section
        className="flex-1 relative"
        aria-label="Fourier epicycles animation. Rotating circles of decreasing size trace a square wave."
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="Animated chain of rotating circles tracing a square wave shape using Fourier series."
        />
      </section>

      <footer className={`px-6 py-4 text-xs ${mutedText} border-t ${borderColor} shrink-0`}>
        Square-wave Fourier approximation using 8 odd harmonics. Mathematics by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Fourier_series"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-70"
        >
          Joseph Fourier
        </a>
        . Each circle is one frequency component.
      </footer>
    </main>
  );
}
