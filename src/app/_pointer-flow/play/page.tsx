"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { clamp } from "@/lib/creative/math";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { makeBalloons, makeShockwave, stepBalloon, stepShockwaves, drawBalloon } from "../field";
import type { Balloon, Shockwave } from "../field";

const DARK_BG = "#0a0a0f";
const LIGHT_BG = "#f4f5f8";

/** Clamp applied to every frame dt to prevent spiral-of-death on slow frames. */
const MAX_DT = 0.05;

type Mode = "attract" | "repel";
type Theme = "light" | "dark";

export default function PointerFlowPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balloonsRef = useRef<Balloon[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const timeRef = useRef(0);

  const [count, setCount] = useState(12);
  const [mode, setMode] = useState<Mode>("attract");
  const [strength, setStrength] = useState(5);
  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";
  const bg = theme === "light" ? LIGHT_BG : DARK_BG;

  // Stable refs for values read inside the animation callback.
  const countRef = useRef(count);
  const modeRef = useRef<Mode>(mode);
  const strengthRef = useRef(strength);
  const themeRef = useRef<Theme>(theme);
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    strengthRef.current = strength;
  }, [strength]);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Re-seed balloons when count changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    balloonsRef.current = makeBalloons({
      count,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      seed: "pointer-flow",
    });
  }, [count]);

  // DPR-aware canvas fit; rebuilds the balloon set on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      balloonsRef.current = makeBalloons({
        count: countRef.current,
        width: w,
        height: h,
        seed: "pointer-flow",
      });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const pointerAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerRef.current = pointerAt(e);
  }, []);

  const onPointerLeave = useCallback(() => {
    pointerRef.current = null;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerAt(e);
    const canvas = canvasRef.current;
    const canvasSize = canvas ? Math.max(canvas.clientWidth, canvas.clientHeight) : 800;
    shockwavesRef.current = [
      ...shockwavesRef.current,
      makeShockwave(p.x, p.y, strengthRef.current, canvasSize),
    ];
  }, []);

  useAnimationFrame(
    useCallback(({ dt }: FrameInfo) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const t = themeRef.current;
      const isDark = t === "dark";
      const safeDt = clamp(dt, 0, MAX_DT);
      timeRef.current += safeDt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = isDark ? DARK_BG : LIGHT_BG;
      ctx.fillRect(0, 0, cssW, cssH);

      // Advance shockwaves.
      shockwavesRef.current = stepShockwaves(shockwavesRef.current, safeDt);

      // Draw shockwave rings.
      for (const sw of shockwavesRef.current) {
        const progress = clamp(sw.age / 1.4, 0, 1);
        const alpha = (1 - progress) * 0.7;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = cbColor(2, t);
        ctx.lineWidth = 3 * (1 - progress * 0.7);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Step and draw balloons.
      const balloons = balloonsRef.current;
      for (const b of balloons) {
        stepBalloon(
          b,
          pointerRef.current,
          shockwavesRef.current,
          balloons,
          modeRef.current,
          strengthRef.current,
          safeDt,
          cssW,
          cssH,
        );
      }
      for (const b of balloons) {
        drawBalloon(ctx, b, cbColor(b.colorIdx, t), timeRef.current, isDark);
      }
      ctx.globalAlpha = 1;
    }, []),
    { pauseWhenHidden: true },
  );

  const labelClass = "text-xs text-foreground/70";
  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const selectClass =
    "text-sm rounded border border-border bg-background text-foreground/80 hover:text-foreground px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const countId = "pf-count-label";
  const strengthId = "pf-strength-label";
  const modeId = "pf-mode-label";

  return (
    <PlayShell
      slug="pointer-flow"
      title="Pointer Flow"
      visualLabel="Soft blobby balloons that drift toward the cursor and get blasted by a shockwave on click. Move and click to interact."
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={countId} className={labelClass}>
              balloons
            </span>
            <input
              type="range"
              min={4}
              max={18}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={countId}
              aria-valuemin={4}
              aria-valuemax={18}
              aria-valuenow={count}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">{count}</span>
          </div>
          <div className="flex items-center gap-2">
            <label id={modeId} htmlFor="pf-mode" className={labelClass}>
              mode
            </label>
            <select
              id="pf-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className={selectClass}
              aria-labelledby={modeId}
            >
              <option value="attract">attract</option>
              <option value="repel">repel</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span id={strengthId} className={labelClass}>
              strength
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={strengthId}
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={strength}
            />
          </div>
        </>
      }
      attribution={
        <>Move over the canvas to drift balloons. Click to blast them with a shockwave.</>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Soft blobby balloons float on the canvas. Move the cursor to attract or repel them, and click to send a shockwave that visibly hits and squashes each balloon as it passes."
        suppressHydrationWarning
        style={{ background: bg }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
      />
    </PlayShell>
  );
}
