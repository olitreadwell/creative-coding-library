"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { samplePath, type LissajousParams } from "../curve";

const STEPS = 2000;
const DECAY = 0.04;
const PHASE_SPEED = 0.18;
const BASE_HUE = 200;
const HUE_RANGE = 160;
const LINE_WIDTH = 1.2;
const GLOW_ALPHA = 0.55;

// Light theme: deep indigo/violet pen on cream-white paper
const DARK_BG = "#06060e";
const LIGHT_BG = "#f5f4f0";
const LIGHT_BASE_HUE = 255; // deep indigo
const LIGHT_HUE_RANGE = 60; // indigo → violet
const LIGHT_LINE_ALPHA = 0.72;

type Ratio = { a: number; b: number; label: string };

const RATIO_PRESETS: readonly Ratio[] = [
  { a: 3, b: 2, label: "3 : 2" },
  { a: 5, b: 4, label: "5 : 4" },
  { a: 3, b: 4, label: "3 : 4" },
  { a: 5, b: 6, label: "5 : 6" },
];

type DrawState = {
  width: number;
  height: number;
  phase: number;
  ratio: Ratio;
  dark: boolean;
};

function drawCurve(ctx: CanvasRenderingContext2D, state: DrawState): void {
  const { width, height, phase, ratio, dark } = state;
  const hw = width / 2;
  const hh = height / 2;
  const radius = Math.min(hw, hh) * 0.85;

  const params: LissajousParams = {
    a: ratio.a,
    b: ratio.b,
    A: radius,
    B: radius,
    phase,
    decay: DECAY,
  };

  const pts = samplePath(params, STEPS);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = dark ? DARK_BG : LIGHT_BG;
  ctx.fillRect(0, 0, width, height);

  if (dark) {
    ctx.globalCompositeOperation = "lighter";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.lineWidth = LINE_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    if (!prev || !curr) continue;

    const t = i / (pts.length - 1);

    let strokeStyle: string;
    if (dark) {
      const hue = map(t, 0, 1, BASE_HUE, BASE_HUE + HUE_RANGE);
      strokeStyle = hslString(hsl(hue, 0.9, 0.65), GLOW_ALPHA);
    } else {
      const hue = map(t, 0, 1, LIGHT_BASE_HUE, LIGHT_BASE_HUE + LIGHT_HUE_RANGE);
      // Dark saturated line: high saturation, low lightness for strong contrast on light bg
      strokeStyle = hslString(hsl(hue, 0.85, 0.28), LIGHT_LINE_ALPHA);
    }

    ctx.strokeStyle = strokeStyle;

    ctx.beginPath();
    ctx.moveTo(hw + prev.x, hh + prev.y);
    ctx.lineTo(hw + curr.x, hh + curr.y);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
}

export default function LissajousPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<number>(0);
  const [ratio, setRatio] = useState<Ratio>(RATIO_PRESETS[0] ?? { a: 3, b: 2, label: "3 : 2" });
  const { resolvedTheme } = useTheme();
  // Guard undefined (SSR / before hydration) with "dark" default
  const isDark = resolvedTheme === undefined ? true : resolvedTheme !== "light";

  const ratioRef = useRef<Ratio>(ratio);
  useEffect(() => {
    ratioRef.current = ratio;
  }, [ratio]);

  // Track isDark in a ref so the animation frame callback always sees the latest value
  const isDarkRef = useRef<boolean>(isDark);
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = cv.clientWidth;
      const cssH = cv.clientHeight;
      cv.width = cssW * dpr;
      cv.height = cssH * dpr;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      // Draw immediately on resize so the canvas is never blank.
      drawCurve(ctx, {
        width: cssW,
        height: cssH,
        phase: phaseRef.current,
        ratio: ratioRef.current,
        dark: isDarkRef.current,
      });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);

  // Redraw immediately when theme changes (without waiting for the next animation frame tick)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    drawCurve(ctx, {
      width: cv.width / dpr,
      height: cv.height / dpr,
      phase: phaseRef.current,
      ratio: ratioRef.current,
      dark: isDark,
    });
  }, [isDark]);

  useAnimationFrame(
    useCallback(({ dt }: { dt: number }) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;

      phaseRef.current += PHASE_SPEED * dt;

      const dpr = window.devicePixelRatio || 1;
      drawCurve(ctx, {
        width: cv.width / dpr,
        height: cv.height / dpr,
        phase: phaseRef.current,
        ratio: ratioRef.current,
        dark: isDarkRef.current,
      });
    }, []),
    { pauseWhenHidden: true, respectReducedMotion: true },
  );

  const bg = isDark ? DARK_BG : LIGHT_BG;
  const borderColor = isDark ? "border-white/10" : "border-black/10";
  const textMuted = isDark ? "text-white/70" : "text-black/60";
  const textPrimary = isDark ? "text-white/90" : "text-black/85";
  const btnActive = isDark
    ? "border-white/60 text-white bg-white/10"
    : "border-black/50 text-black bg-black/8";
  const btnInactive = isDark
    ? "border-white/25 text-white/70 hover:border-white/50 hover:text-white/90"
    : "border-black/20 text-black/60 hover:border-black/40 hover:text-black/80";
  const focusRing = isDark ? "focus-visible:ring-white/70" : "focus-visible:ring-black/50";

  return (
    <main className="min-h-screen text-foreground flex flex-col" style={{ background: bg }}>
      <header
        className={`px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-3 border-b ${borderColor}`}
      >
        <nav aria-label="Back to detail page" className="shrink-0">
          <Link
            href="/lissajous"
            aria-label="Back to Lissajous detail page"
            className={`inline-flex items-center gap-1.5 text-sm ${textMuted} hover:${isDark ? "text-white" : "text-black"} underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 ${focusRing} rounded`}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back
          </Link>
        </nav>

        <h1 className={`text-sm font-medium tracking-wide ${textPrimary} flex-1 min-w-0 truncate`}>
          Lissajous — live sketch
        </h1>

        <div
          role="group"
          aria-label="Frequency ratio presets"
          className="flex flex-wrap gap-2 shrink-0"
        >
          {RATIO_PRESETS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setRatio(r)}
              aria-pressed={ratio.label === r.label}
              aria-label={`Frequency ratio ${r.label}`}
              className={[
                "text-xs px-3 py-1 rounded border transition-colors",
                `focus-visible:outline-none focus-visible:ring-2 ${focusRing}`,
                ratio.label === r.label ? btnActive : btnInactive,
              ].join(" ")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <section className="flex-1 relative" aria-label="Animated Lissajous harmonograph">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="Lissajous curve animation. Two sine waves combine to trace a morphing path."
          style={{ background: bg }}
        />
      </section>

      <footer className={`px-4 sm:px-6 py-3 sm:py-4 text-xs ${textMuted} border-t ${borderColor}`}>
        Technique: parametric sine curves
        {isDark ? " with additive glow" : " rendered as pen drawing"}. Named after{" "}
        <a
          href="https://en.wikipedia.org/wiki/Lissajous_curve"
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 hover:${isDark ? "text-white/90" : "text-black/85"} focus-visible:outline-none focus-visible:ring-2 ${focusRing} rounded`}
        >
          Jules Antoine Lissajous
        </a>
        .
      </footer>
    </main>
  );
}
