"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor, cbColors } from "@/lib/creative";
import { clamp } from "@/lib/creative/math";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { makeParticles, stepParticle, ageImpulses } from "../field";
import type { Particle, Impulse } from "../field";

const DARK_BG = "#0a0a0f";
const LIGHT_BG = "#f4f5f8";

type Mode = "attract" | "repel";
type Ring = { x: number; y: number; age: number };
type Theme = "light" | "dark";

export default function PointerFlowPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const impulsesRef = useRef<Impulse[]>([]);
  const ringsRef = useRef<Ring[]>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  const [count, setCount] = useState(220);
  const [mode, setMode] = useState<Mode>("attract");
  const [strength, setStrength] = useState(3);
  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";
  const bg = theme === "light" ? LIGHT_BG : DARK_BG;

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

  // Re-seed particles when the count changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    particlesRef.current = makeParticles({
      count,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      seed: "pointer-flow",
    });
  }, [count]);

  // DPR-aware fit; fill the container at any size.
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
      particlesRef.current = makeParticles({
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
    impulsesRef.current = [
      ...impulsesRef.current,
      { x: p.x, y: p.y, strength: strengthRef.current, age: 0 },
    ];
    ringsRef.current = [...ringsRef.current, { x: p.x, y: p.y, age: 0 }];
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
      const palette = cbColors(t);
      const safeDt = clamp(dt, 0, 0.05);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = t === "light" ? LIGHT_BG : DARK_BG;
      ctx.fillRect(0, 0, cssW, cssH);

      impulsesRef.current = ageImpulses(impulsesRef.current, safeDt);
      ringsRef.current = ringsRef.current
        .map((r) => ({ ...r, age: r.age + safeDt }))
        .filter((r) => r.age < 0.6);

      for (const ring of ringsRef.current) {
        const progress = ring.age / 0.6;
        const radius = progress * Math.max(cssW, cssH) * 0.35;
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = cbColor(2, t);
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.globalAlpha = 0.85;
      for (const p of particlesRef.current) {
        stepParticle(
          p,
          pointerRef.current,
          impulsesRef.current,
          modeRef.current,
          strengthRef.current,
          safeDt,
          cssW,
          cssH,
        );
        const idx = Math.floor((p.hue / 360) * palette.length) % palette.length;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = cbColor(idx, t);
        ctx.fill();
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
      visualLabel="A field of particles that chases the cursor and scatters on click. Move and click to interact."
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={countId} className={labelClass}>
              particles
            </span>
            <input
              type="range"
              min={40}
              max={600}
              step={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={countId}
              aria-valuemin={40}
              aria-valuemax={600}
              aria-valuenow={count}
            />
            <span className="w-9 text-right text-xs text-foreground/70 tabular-nums">{count}</span>
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
        <>Move and click the canvas: particles steer to your cursor and scatter on click.</>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="A field of particles that chases the cursor and scatters when you click. Move and click to interact."
        suppressHydrationWarning
        style={{ background: bg }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
      />
    </PlayShell>
  );
}
