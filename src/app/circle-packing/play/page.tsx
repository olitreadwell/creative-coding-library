"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp } from "@/lib/creative/cbpalette";
import { clamp, map, smoothstep } from "@/lib/creative/math";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { packCircles, type Circle } from "../pack";

const REVEAL_RATE = 60; // circles revealed per second
const MAX_RADIUS = 64;
const PADDING = 2;

const DARK_BG = "#06060e";
const LIGHT_BG = "#f5f4f0";

const ATTEMPTS_MIN = 200;
const ATTEMPTS_MAX = 2500;
const ATTEMPTS_DEFAULT = 1200;
const MINR_MIN = 2;
const MINR_MAX = 18;
const MINR_DEFAULT = 4;

type DrawState = {
  width: number;
  height: number;
  circles: readonly Circle[];
  reveal: number;
  dark: boolean;
};

function draw(ctx: CanvasRenderingContext2D, state: DrawState): void {
  const { width, height, circles, reveal, dark } = state;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = dark ? DARK_BG : LIGHT_BG;
  ctx.fillRect(0, 0, width, height);

  const theme = dark ? "dark" : "light";
  ctx.lineWidth = 1.25;

  for (let i = 0; i < circles.length; i++) {
    const c = circles[i];
    if (!c) continue;
    const grow = smoothstep(0, 1, clamp(reveal - i, 0, 1));
    if (grow <= 0) break; // circles are revealed in order; nothing past here is visible yet
    const r = c.r * grow;
    // Smaller circles sit at the cool end of the ramp, larger ones at the warm end.
    const t = map(c.r, MINR_MIN, MAX_RADIUS, 0, 1);
    const color = cbRamp(clamp(t, 0, 1), theme);
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = dark ? 0.85 : 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.22)";
    ctx.stroke();
  }
}

export default function CirclePackingPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circlesRef = useRef<Circle[]>([]);
  const revealRef = useRef<number>(0);

  const [seed, setSeed] = useState<number>(1);
  const [attempts, setAttempts] = useState<number>(ATTEMPTS_DEFAULT);
  const [minRadius, setMinRadius] = useState<number>(MINR_DEFAULT);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === undefined ? true : resolvedTheme !== "light";
  const isDarkRef = useRef<boolean>(isDark);
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const seedRef = useRef<number>(seed);
  const attemptsRef = useRef<number>(attempts);
  const minRadiusRef = useRef<number>(minRadius);
  useEffect(() => {
    seedRef.current = seed;
  }, [seed]);
  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);
  useEffect(() => {
    minRadiusRef.current = minRadius;
  }, [minRadius]);

  const regenerate = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.width / dpr;
    const h = cv.height / dpr;
    if (w <= 0 || h <= 0) return;
    circlesRef.current = packCircles(makeRng(seedRef.current), {
      width: w,
      height: h,
      attempts: attemptsRef.current,
      minRadius: minRadiusRef.current,
      maxRadius: MAX_RADIUS,
      padding: PADDING,
    });
    revealRef.current = 0;
  }, []);

  const render = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    draw(ctx, {
      width: cv.width / dpr,
      height: cv.height / dpr,
      circles: circlesRef.current,
      reveal: revealRef.current,
      dark: isDarkRef.current,
    });
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      regenerate();
      render();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [regenerate, render]);

  // Reseed / re-pack when a control changes, then replay the reveal.
  useEffect(() => {
    regenerate();
    render();
  }, [seed, attempts, minRadius, regenerate, render]);

  useEffect(() => {
    render();
  }, [isDark, render]);

  useAnimationFrame(
    useCallback(
      ({ dt }: { dt: number }) => {
        const total = circlesRef.current.length;
        if (revealRef.current < total + 1) {
          revealRef.current = Math.min(revealRef.current + REVEAL_RATE * dt, total + 1);
        }
        render();
      },
      [render],
    ),
    { pauseWhenHidden: true, reducedMotionFrames: 1 },
  );

  const bg = isDark ? DARK_BG : LIGHT_BG;
  const densityLabelId = "pack-density-label";
  const minrLabelId = "pack-minr-label";
  const btnClass =
    "text-xs px-3 py-1 rounded border border-border text-foreground/70 transition-colors hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="circle-packing"
      title="Circle Packing — live sketch"
      visualLabel="Circle packing. Circles appear one by one and grow until they touch their neighbors, filling the canvas."
      attribution={
        <>
          Technique: greedy grow-until-collision packing driven by a seeded{" "}
          <a
            href="https://en.wikipedia.org/wiki/Circle_packing"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            circle packing
          </a>
          .
        </>
      }
      controls={
        <>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className={btnClass}
            aria-label="Shuffle to a new random packing"
          >
            shuffle
          </button>

          <div className="flex items-center gap-2">
            <span id={densityLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              density
            </span>
            <input
              type="range"
              min={ATTEMPTS_MIN}
              max={ATTEMPTS_MAX}
              step={100}
              value={attempts}
              onChange={(e) => setAttempts(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={densityLabelId}
              aria-valuemin={ATTEMPTS_MIN}
              aria-valuemax={ATTEMPTS_MAX}
              aria-valuenow={attempts}
            />
            <span className="w-10 text-right text-xs text-foreground/70 tabular-nums">
              {attempts}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span id={minrLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              min size
            </span>
            <input
              type="range"
              min={MINR_MIN}
              max={MINR_MAX}
              step={1}
              value={minRadius}
              onChange={(e) => setMinRadius(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={minrLabelId}
              aria-valuemin={MINR_MIN}
              aria-valuemax={MINR_MAX}
              aria-valuenow={minRadius}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">
              {minRadius}
            </span>
          </div>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Circle packing animation. Non-overlapping circles fill the canvas, largest first."
        suppressHydrationWarning
        style={{ background: bg }}
      />
    </PlayShell>
  );
}
