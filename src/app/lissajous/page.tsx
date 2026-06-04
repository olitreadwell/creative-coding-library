"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { samplePath, type LissajousParams } from "./curve";

const STEPS = 2000;
const DECAY = 0.04;
const PHASE_SPEED = 0.18;
const BASE_HUE = 200;
const HUE_RANGE = 160;
const LINE_WIDTH = 1.2;
const GLOW_ALPHA = 0.55;

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
};

function drawCurve(ctx: CanvasRenderingContext2D, state: DrawState): void {
  const { width, height, phase, ratio } = state;
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
  ctx.fillStyle = "#06060e";
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    if (!prev || !curr) continue;

    const t = i / (pts.length - 1);
    const hue = map(t, 0, 1, BASE_HUE, BASE_HUE + HUE_RANGE);
    ctx.strokeStyle = hslString(hsl(hue, 0.9, 0.65), GLOW_ALPHA);

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

  const ratioRef = useRef<Ratio>(ratio);
  useEffect(() => {
    ratioRef.current = ratio;
  }, [ratio]);

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
      });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);

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
      });
    }, []),
    { pauseWhenHidden: true, respectReducedMotion: true },
  );

  return (
    <main className="min-h-screen bg-[#06060e] text-foreground flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white underline underline-offset-2"
          >
            &larr; home
          </Link>
        </nav>

        <h1 className="text-sm font-medium tracking-wide text-white/80">Lissajous</h1>

        <div role="group" aria-label="Frequency ratio presets" className="flex gap-2">
          {RATIO_PRESETS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setRatio(r)}
              aria-pressed={ratio.label === r.label}
              className={[
                "text-xs px-3 py-1 rounded border transition-colors",
                ratio.label === r.label
                  ? "border-white/60 text-white bg-white/10"
                  : "border-white/20 text-white/50 hover:border-white/40 hover:text-white/80",
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
          aria-hidden="true"
          style={{ background: "#06060e" }}
        />
      </section>

      <footer className="px-6 py-4 text-xs text-white/30 border-t border-white/10">
        Technique: parametric sine curves with additive glow. Named after{" "}
        <a
          href="https://en.wikipedia.org/wiki/Lissajous_curve"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-white/60"
        >
          Jules Antoine Lissajous
        </a>
        .
      </footer>
    </main>
  );
}
