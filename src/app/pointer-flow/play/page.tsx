"use client";

import { useRef, useEffect, useState, useCallback, useId } from "react";
import Link from "next/link";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { hslString, hsl } from "@/lib/creative/color";
import { clamp } from "@/lib/creative/math";
import { makeParticles, stepParticle, ageImpulses } from "../field";
import type { Particle, Impulse } from "../field";

const OKABE_HUES = [56, 27, 202, 301, 186, 14, 246] as const;

type Mode = "attract" | "repel";

type Ring = {
  x: number;
  y: number;
  age: number;
};

function getIsDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function particleColor(hue: number, isDark: boolean, alpha: number): string {
  const lightness = isDark ? 0.72 : 0.38;
  const saturation = isDark ? 0.85 : 0.75;
  return hslString(hsl(hue, saturation, lightness), alpha);
}

export default function PointerFlowPlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const impulsesRef = useRef<Impulse[]>([]);
  const ringsRef = useRef<Ring[]>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const isDarkRef = useRef<boolean>(true);

  const [count, setCount] = useState(200);
  const [mode, setMode] = useState<Mode>("attract");
  const [strength, setStrength] = useState(3);

  const countRef = useRef(count);
  const modeRef = useRef<Mode>(mode);
  const strengthRef = useRef(strength);

  useEffect(() => { countRef.current = count; }, [count]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { strengthRef.current = strength; }, [strength]);

  const countLabelId = useId();
  const strengthLabelId = useId();

  useEffect(() => {
    isDarkRef.current = getIsDark();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      isDarkRef.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    particlesRef.current = makeParticles({
      count,
      width: W,
      height: H,
      seed: "pointer-flow",
    });
  }, [count]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      particlesRef.current = makeParticles({
        count: countRef.current,
        width: W,
        height: H,
        seed: "pointer-flow",
      });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const onPointerLeave = useCallback(() => {
    pointerRef.current = null;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    impulsesRef.current = [
      ...impulsesRef.current,
      { x, y, strength: strengthRef.current, age: 0 },
    ];
    ringsRef.current = [...ringsRef.current, { x, y, age: 0 }];
  }, []);

  useAnimationFrame(({ dt }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const isDark = isDarkRef.current;
    const bg = isDark ? "#0a0a0a" : "#f5f4f0";
    const safeDt = clamp(dt, 0, 0.05);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);

    impulsesRef.current = ageImpulses(impulsesRef.current, safeDt);

    ringsRef.current = ringsRef.current
      .map((r) => ({ ...r, age: r.age + safeDt }))
      .filter((r) => r.age < 0.6);

    for (const ring of ringsRef.current) {
      const progress = ring.age / 0.6;
      const radius = progress * 200;
      const alpha = (1 - progress) * 0.6;
      const hue = OKABE_HUES[Math.floor(ring.x + ring.y) % OKABE_HUES.length] ?? 202;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = hslString(hsl(hue, 0.8, isDark ? 0.7 : 0.4), alpha);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

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

      const hue = OKABE_HUES[Math.floor(p.hue / (360 / OKABE_HUES.length)) % OKABE_HUES.length] ?? 202;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = particleColor(hue, isDark, 0.85);
      ctx.fill();
    }
  }, { pauseWhenHidden: true });

  const bg = isDarkRef.current ? "#0a0a0a" : "#f5f4f0";

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center gap-4 border-b border-foreground/10 px-4 py-3">
        <Link href="/pointer-flow" className="text-sm text-foreground/70 underline">
          ← Pointer Flow
        </Link>
        <span className="text-sm font-medium">Play</span>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          suppressHydrationWarning
          style={{ background: bg }}
          aria-label="Interactive particle field: particles chase or flee the cursor; click to emit a shockwave."
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerDown={onPointerDown}
        />
      </div>

      <footer className="flex flex-wrap items-center gap-6 border-t border-foreground/10 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span id={countLabelId} className="text-foreground/70">
            Particles
          </span>
          <input
            type="range"
            min={20}
            max={600}
            step={10}
            value={count}
            aria-labelledby={countLabelId}
            aria-valuemin={20}
            aria-valuemax={600}
            aria-valuenow={count}
            className="w-28 accent-foreground/80"
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <span className="w-8 text-right tabular-nums text-foreground/60">{count}</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="mode-select" className="text-foreground/70">
            Mode
          </label>
          <select
            id="mode-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="rounded border border-foreground/20 bg-background px-2 py-0.5 text-foreground/90"
          >
            <option value="attract">Attract</option>
            <option value="repel">Repel</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span id={strengthLabelId} className="text-foreground/70">
            Strength
          </span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={strength}
            aria-labelledby={strengthLabelId}
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={strength}
            className="w-24 accent-foreground/80"
            onChange={(e) => setStrength(Number(e.target.value))}
          />
          <span className="w-4 text-right tabular-nums text-foreground/60">{strength}</span>
        </div>

        <span className="ml-auto text-foreground/40">MIT license</span>
      </footer>
    </div>
  );
}
