"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import {
  makeMushroom,
  scatterMushrooms,
  drawMushroom,
  type MushroomGeometry,
  type ThemeName,
} from "../mushroom";

const DARK_BG = "#0d1117";
const LIGHT_BG = "#f0ede6";

const DEFAULT_COUNT = 18;
const MIN_COUNT = 5;
const MAX_COUNT = 40;

const DEFAULT_SWAY = 0.5;
const MIN_SWAY = 0;
const MAX_SWAY = 2;
const STEP_SWAY = 0.1;

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

type SceneState = {
  mushrooms: MushroomGeometry[];
  width: number;
  height: number;
};

const btnClass =
  "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const sliderClass =
  "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const labelClass = "text-xs text-foreground/70";
const valueLabelClass = "w-10 text-right text-xs text-foreground/70 tabular-nums";

export default function ShroomsPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneState | null>(null);

  const [seed, setSeed] = useState<number>(() => randomSeed());
  const [count, setCount] = useState<number>(DEFAULT_COUNT);
  const [swaySpeed, setSwaySpeed] = useState<number>(DEFAULT_SWAY);

  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "dark") as ThemeName;

  // Keep mutable params in refs so the animation loop doesn't need to restart.
  const themeRef = useRef(theme);
  const swayRef = useRef(swaySpeed);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    swayRef.current = swaySpeed;
  }, [swaySpeed]);

  const buildScene = useCallback(
    (width: number, height: number, activeSeed: number, activeCount: number) => {
      const groundY = height * 0.82;
      const rng = makeRng(activeSeed);
      const mushrooms = scatterMushrooms(rng, activeCount, width, groundY);
      sceneRef.current = { mushrooms, width, height };
    },
    [],
  );

  // Fit the canvas and (re-)build the scene whenever seed, count, or theme changes.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      const ctx = cv.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene(w, h, seed, count);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, count, resolvedTheme, buildScene]);

  // Add a mushroom at the pointer position.
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const baseY = e.clientY - rect.top;

    const scene = sceneRef.current;
    if (!scene) return;

    const rng = makeRng(Date.now() ^ Math.floor(x * 100));
    const newMushroom = makeMushroom(rng, x, baseY);

    // Insert in depth order so new mushroom is drawn in the right layer.
    const updated = [...scene.mushrooms, newMushroom].sort((a, b) => a.depth - b.depth);
    sceneRef.current = { ...scene, mushrooms: updated };
  }, []);

  useAnimationFrame(
    useCallback(({ t }: { t: number }) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const scene = sceneRef.current;
      if (!scene) return;

      const activeTheme = themeRef.current;
      const bg = activeTheme === "light" ? LIGHT_BG : DARK_BG;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, scene.width, scene.height);

      // Ground line.
      const groundY = scene.height * 0.82;
      ctx.save();
      ctx.globalAlpha = activeTheme === "dark" ? 0.18 : 0.22;
      ctx.fillStyle = activeTheme === "dark" ? "#3a3020" : "#b8a888";
      ctx.fillRect(0, groundY, scene.width, scene.height - groundY);
      ctx.restore();

      const currentSway = swayRef.current;

      for (const m of scene.mushrooms) {
        // Per-mushroom sway: offset varies by x position and time.
        const phase = m.x * 0.013 + m.depth * 2.3;
        const sway = Math.sin(t * currentSway + phase) * m.capRx * 0.08;
        drawMushroom(ctx, m, sway, activeTheme);
      }
    }, []),
    { pauseWhenHidden: true },
  );

  const countLabelId = "shrooms-count-label";
  const swayLabelId = "shrooms-sway-label";

  return (
    <PlayShell
      slug="shrooms"
      title="Mushrooms"
      visualLabel="Animated canvas showing a procedural patch of mushrooms that sway gently. Click the canvas to grow a new mushroom at the pointer."
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={countLabelId} className={labelClass}>
              count
            </span>
            <input
              type="range"
              min={MIN_COUNT}
              max={MAX_COUNT}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={countLabelId}
              aria-valuemin={MIN_COUNT}
              aria-valuemax={MAX_COUNT}
              aria-valuenow={count}
            />
            <span className={valueLabelClass}>{count}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={swayLabelId} className={labelClass}>
              sway
            </span>
            <input
              type="range"
              min={MIN_SWAY}
              max={MAX_SWAY}
              step={STEP_SWAY}
              value={swaySpeed}
              onChange={(e) => setSwaySpeed(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={swayLabelId}
              aria-valuemin={MIN_SWAY}
              aria-valuemax={MAX_SWAY}
              aria-valuenow={swaySpeed}
            />
            <span className={valueLabelClass}>{swaySpeed.toFixed(1)}</span>
          </div>
          <button
            type="button"
            onClick={() => setSeed(randomSeed())}
            className={btnClass}
            aria-label="Regenerate the mushroom patch with a new random seed"
          >
            Regenerate
          </button>
        </>
      }
      attribution={<>Procedural mushroom shapes from geometric primitives. Original sketch.</>}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Animated canvas with procedural mushrooms. Click anywhere to grow a new mushroom at that spot."
        suppressHydrationWarning
        style={{ background: theme === "light" ? LIGHT_BG : DARK_BG }}
        onPointerDown={handlePointerDown}
      />
    </PlayShell>
  );
}
