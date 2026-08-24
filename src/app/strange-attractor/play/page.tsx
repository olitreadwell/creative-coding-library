"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp } from "@/lib/creative";
import { clamp } from "@/lib/creative/math";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import {
  stepDeJong,
  DEFAULT_PARAMS,
  PRESETS,
  PARAM_MIN,
  PARAM_MAX,
  type DeJongParams,
} from "../attractor";

const DARK_BG = "#06070d";
const LIGHT_BG = "#f5f5f0";
const POINTS_PER_FRAME = 7000;
// Drawn in a single frame right after a parameter change so the attractor
// appears already formed instead of flashing in from an empty canvas.
const WARMUP_POINTS = 90000;
const KEY_STEP = 0.02;
type Theme = "light" | "dark";

export default function StrangeAttractorPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [params, setParams] = useState<DeJongParams>(DEFAULT_PARAMS);
  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";
  const bg = theme === "light" ? LIGHT_BG : DARK_BG;

  const paramsRef = useRef<DeJongParams>(params);
  const themeRef = useRef<Theme>(theme);
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0.1, y: 0.1 });
  const clearRef = useRef<boolean>(true);
  useEffect(() => {
    paramsRef.current = params;
    clearRef.current = true;
    cursorRef.current = { x: 0.1, y: 0.1 };
  }, [params]);
  useEffect(() => {
    themeRef.current = theme;
    clearRef.current = true;
  }, [theme]);

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
      clearRef.current = true;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const t = themeRef.current;
    const light = t === "light";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // On a parameter change we clear and rebuild. To avoid a flash to an empty
    // canvas (very visible when holding the arrow keys), the cleared frame draws
    // a big warmup batch so a formed attractor appears immediately.
    const justCleared = clearRef.current;
    if (justCleared) {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = light ? LIGHT_BG : DARK_BG;
      ctx.fillRect(0, 0, w, h);
      clearRef.current = false;
    }

    const scale = Math.min(w, h) * 0.23;
    const cx = w / 2;
    const cy = h / 2;
    const p = paramsRef.current;
    let { x, y } = cursorRef.current;

    ctx.globalCompositeOperation = light ? "source-over" : "lighter";
    ctx.globalAlpha = light ? 0.09 : 0.07;

    const points = justCleared ? WARMUP_POINTS : POINTS_PER_FRAME;
    for (let i = 0; i < points; i++) {
      const next = stepDeJong(x, y, p);
      x = next.x;
      y = next.y;
      const px = cx + x * scale;
      const py = cy + y * scale;
      ctx.fillStyle = cbRamp((x + 2) / 4, t);
      ctx.fillRect(px, py, 1, 1);
    }

    cursorRef.current = { x, y };
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }, []);

  useAnimationFrame(renderFrame, { pauseWhenHidden: true, reducedMotionFrames: 60 });

  // Redraw immediately when a control changes while paused.
  useEffect(() => {
    renderFrame();
  }, [params, theme, renderFrame]);

  const setParam = (key: keyof DeJongParams, value: number) =>
    setParams((prev) => ({ ...prev, [key]: clamp(value, PARAM_MIN, PARAM_MAX) }));

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    let handled = true;
    if (e.key === "ArrowLeft") setParam("a", paramsRef.current.a - KEY_STEP);
    else if (e.key === "ArrowRight") setParam("a", paramsRef.current.a + KEY_STEP);
    else if (e.key === "ArrowUp") setParam("b", paramsRef.current.b + KEY_STEP);
    else if (e.key === "ArrowDown") setParam("b", paramsRef.current.b - KEY_STEP);
    else handled = false;
    if (handled) e.preventDefault();
  };

  const randomize = () => {
    const rnd = () => PARAM_MIN + Math.random() * (PARAM_MAX - PARAM_MIN);
    setParams({ a: rnd(), b: rnd(), c: rnd(), d: rnd() });
  };

  const labelClass = "text-xs text-foreground/70";
  const sliderClass =
    "w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const selectClass =
    "text-sm rounded border border-border bg-background text-foreground/80 hover:text-foreground px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const sliders: Array<keyof DeJongParams> = ["a", "b", "c", "d"];

  return (
    <PlayShell
      slug="strange-attractor"
      title="Strange Attractor"
      visualLabel="A de Jong strange attractor drawn from millions of points. Focus it and use the arrow keys to morph it."
      controls={
        <>
          <div className="flex items-center gap-2">
            <label id="sa-preset" htmlFor="sa-preset-select" className={labelClass}>
              preset
            </label>
            <select
              id="sa-preset-select"
              className={selectClass}
              aria-labelledby="sa-preset"
              defaultValue=""
              onChange={(e) => {
                const found = PRESETS.find((pr) => pr.label === e.target.value);
                if (found) setParams(found.params);
              }}
            >
              <option value="" disabled>
                choose
              </option>
              {PRESETS.map((pr) => (
                <option key={pr.label} value={pr.label}>
                  {pr.label}
                </option>
              ))}
            </select>
          </div>
          {sliders.map((key) => (
            <div key={key} className="flex items-center gap-1.5">
              <span id={`sa-${key}`} className={labelClass}>
                {key}
              </span>
              <input
                type="range"
                min={PARAM_MIN}
                max={PARAM_MAX}
                step={0.01}
                value={params[key]}
                onChange={(e) => setParam(key, Number(e.target.value))}
                className={sliderClass}
                aria-labelledby={`sa-${key}`}
                aria-valuemin={PARAM_MIN}
                aria-valuemax={PARAM_MAX}
                aria-valuenow={params[key]}
              />
            </div>
          ))}
          <button type="button" onClick={randomize} className={btnClass}>
            Randomize
          </button>
        </>
      }
      attribution={
        <>Focus the canvas and use the arrow keys to morph the attractor (or use the sliders).</>
      }
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        className="absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label="A de Jong strange attractor. Press the arrow keys to change its shape: left and right adjust parameter a, up and down adjust parameter b. The sliders below also change all four parameters."
        suppressHydrationWarning
        style={{ background: bg }}
        onKeyDown={onKeyDown}
      />
    </PlayShell>
  );
}
