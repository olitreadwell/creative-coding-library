"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp } from "@/lib/creative";
import { clamp } from "@/lib/creative/math";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { seedPosition, GOLDEN_ANGLE_DEG } from "../phyllotaxis";

const DARK_BG = "#080a10";
const LIGHT_BG = "#f5f5f0";
const MIN_COUNT = 50;
const MAX_COUNT = 3000;
type Theme = "light" | "dark";

export default function PhyllotaxisPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState<number>(900);
  const [angle, setAngle] = useState<number>(GOLDEN_ANGLE_DEG);
  const [dot, setDot] = useState<number>(1);
  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";
  const bg = theme === "light" ? LIGHT_BG : DARK_BG;

  const countRef = useRef(count);
  const angleRef = useRef(angle);
  const dotRef = useRef(dot);
  const themeRef = useRef<Theme>(theme);
  const rotRef = useRef(0);
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);
  useEffect(() => {
    dotRef.current = dot;
  }, [dot]);
  useEffect(() => {
    themeRef.current = theme;
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
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Scroll the canvas to grow or shrink the bloom. A native non-passive
  // listener lets us preventDefault so the page never scrolls instead.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      setCount((c) => clamp(Math.round(c + dir * 40), MIN_COUNT, MAX_COUNT));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const t = themeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = t === "light" ? LIGHT_BG : DARK_BG;
    ctx.fillRect(0, 0, w, h);

    const n = countRef.current;
    const angleRad = (angleRef.current * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    // Scale so the outermost seed sits near the edge regardless of count.
    const scale = (Math.min(w, h) * 0.47) / Math.sqrt(Math.max(1, n));
    const dotR = Math.max(0.6, scale * 0.42 * dotRef.current);
    const rot = rotRef.current;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);

    for (let i = 0; i < n; i++) {
      const s = seedPosition(i, angleRad, scale);
      const x = cx + (s.x * cosR - s.y * sinR);
      const y = cy + (s.x * sinR + s.y * cosR);
      ctx.fillStyle = cbRamp(i / n, t);
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  useAnimationFrame(
    useCallback(
      ({ dt }: FrameInfo) => {
        rotRef.current += dt * 0.12;
        draw();
      },
      [draw],
    ),
    { pauseWhenHidden: true },
  );

  // Redraw immediately when a control changes while paused.
  useEffect(() => {
    draw();
  }, [count, angle, dot, theme, draw]);

  const labelClass = "text-xs text-foreground/70";
  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="phyllotaxis"
      title="Phyllotaxis"
      visualLabel="A sunflower-like spiral of dots placed by the golden angle. Scroll on it to grow or shrink the bloom."
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id="ph-count" className={labelClass}>
              seeds
            </span>
            <input
              type="range"
              min={MIN_COUNT}
              max={MAX_COUNT}
              step={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="ph-count"
              aria-valuemin={MIN_COUNT}
              aria-valuemax={MAX_COUNT}
              aria-valuenow={count}
            />
            <span className="w-10 text-right text-xs text-foreground/70 tabular-nums">{count}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id="ph-angle" className={labelClass}>
              angle
            </span>
            <input
              type="range"
              min={100}
              max={180}
              step={0.1}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="ph-angle"
              aria-valuemin={100}
              aria-valuemax={180}
              aria-valuenow={angle}
            />
            <span className="w-12 text-right text-xs text-foreground/70 tabular-nums">
              {angle.toFixed(1)}°
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span id="ph-dot" className={labelClass}>
              dot size
            </span>
            <input
              type="range"
              min={0.4}
              max={2.5}
              step={0.1}
              value={dot}
              onChange={(e) => setDot(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="ph-dot"
              aria-valuemin={0.4}
              aria-valuemax={2.5}
              aria-valuenow={dot}
            />
          </div>
          <button type="button" onClick={() => setAngle(GOLDEN_ANGLE_DEG)} className={btnClass}>
            Golden angle
          </button>
        </>
      }
      attribution={
        <>
          Scroll on the canvas to grow or shrink the bloom. Seeds placed by the golden angle using
          the Vogel model.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="A sunflower-like spiral of dots placed by the golden angle. Scroll up or down on it to add or remove seeds, or use the sliders to change the count, angle, and dot size."
        suppressHydrationWarning
        style={{ background: bg }}
      />
    </PlayShell>
  );
}
