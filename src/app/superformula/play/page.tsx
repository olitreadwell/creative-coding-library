"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { TAU } from "@/lib/creative/math";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { superRadius, type SuperformulaParams } from "../superformula";

const STEPS = 720;

const DARK_BG = "#0a0c10";
const LIGHT_BG = "#f7f6f2";

type Preset = {
  label: string;
  params: SuperformulaParams;
};

const PRESETS: Preset[] = [
  { label: "Flower", params: { m: 5, n1: 1, n2: 1, n3: 1, a: 1, b: 1 } },
  { label: "Star", params: { m: 4, n1: 2, n2: 10, n3: 10, a: 1, b: 1 } },
  { label: "Gear", params: { m: 19, n1: 100, n2: 50, n3: 50, a: 1, b: 1 } },
  { label: "Blob", params: { m: 2, n1: 0.5, n2: 0.5, n3: 0.5, a: 1, b: 1 } },
];

const DEFAULT_PARAMS: SuperformulaParams = {
  m: 5,
  n1: 1,
  n2: 1,
  n3: 1,
  a: 1,
  b: 1,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  params: SuperformulaParams,
  cx: number,
  cy: number,
  scale: number,
  strokeColor: string,
  fillColor: string,
  lineWidth: number,
) {
  ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {
    const theta = (i / STEPS) * TAU;
    const r = superRadius(theta, params) * scale;
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

const mLabelId = "sf-m-label";
const n1LabelId = "sf-n1-label";
const n2LabelId = "sf-n2-label";
const n3LabelId = "sf-n3-label";
const presetLabelId = "sf-preset-label";

const sliderClass =
  "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const labelClass = "text-xs text-foreground/70 w-6 shrink-0";
const valueLabelClass = "w-8 text-right text-xs text-foreground/70 tabular-nums";

export default function SuperformulaPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [params, setParams] = useState<SuperformulaParams>(DEFAULT_PARAMS);
  const [preset, setPreset] = useState<string>("Flower");
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "dark") as "light" | "dark";
  const isLight = theme === "light";

  const paramsRef = useRef(params);
  const isLightRef = useRef(isLight);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  useEffect(() => {
    isLightRef.current = isLight;
  }, [isLight]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
      const ctx = cv.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame(
    useCallback(({ t }: FrameInfo) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;

      const light = isLightRef.current;
      const activeTheme: "light" | "dark" = light ? "light" : "dark";
      const bg = light ? LIGHT_BG : DARK_BG;
      const w = cv.clientWidth;
      const h = cv.clientHeight;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const margin = 0.1;
      const maxR = (Math.min(w, h) / 2) * (1 - margin);

      const base = paramsRef.current;

      // Outer ring: gently morphed n1 for auto-animation.
      const morphedN1 = base.n1 + Math.sin(t * 0.4) * 0.6;
      const morphed: SuperformulaParams = { ...base, n1: Math.max(0.05, morphedN1) };

      // Compute the max radius to scale the shape to fill the canvas.
      let maxRad = 0;
      for (let i = 0; i < STEPS; i++) {
        const theta = (i / STEPS) * TAU;
        const r = superRadius(theta, morphed);
        if (r > maxRad) maxRad = r;
      }
      const scale = maxRad > 0 ? maxR / maxRad : 1;

      // Three nested copies at descending scales with colorblind-safe palette.
      const layers = [
        { scale: scale, alpha: 0.12, colorIdx: 1, lw: 1.5 },
        { scale: scale * 0.7, alpha: 0.18, colorIdx: 2, lw: 1.5 },
        { scale: scale * 0.4, alpha: 0.24, colorIdx: 0, lw: 2 },
      ];

      for (const layer of layers) {
        const hex = cbColor(layer.colorIdx, activeTheme);
        const { r, g, b } = hexToRgb(hex);
        const fillColor = `rgba(${r},${g},${b},${layer.alpha})`;
        const strokeColor = `rgba(${r},${g},${b},${light ? 0.85 : 0.9})`;
        drawShape(ctx, morphed, cx, cy, layer.scale, strokeColor, fillColor, layer.lw);
      }
    }, []),
    { pauseWhenHidden: true },
  );

  function applyPreset(label: string) {
    const found = PRESETS.find((p) => p.label === label);
    if (found) {
      setParams({ ...found.params });
      setPreset(label);
    }
  }

  function handlePreset(e: React.ChangeEvent<HTMLSelectElement>) {
    applyPreset(e.target.value);
  }

  function handleM(e: React.ChangeEvent<HTMLInputElement>) {
    setParams((p) => ({ ...p, m: Number(e.target.value) }));
    setPreset("Custom");
  }

  function handleN1(e: React.ChangeEvent<HTMLInputElement>) {
    setParams((p) => ({ ...p, n1: Number(e.target.value) }));
    setPreset("Custom");
  }

  function handleN2(e: React.ChangeEvent<HTMLInputElement>) {
    setParams((p) => ({ ...p, n2: Number(e.target.value) }));
    setPreset("Custom");
  }

  function handleN3(e: React.ChangeEvent<HTMLInputElement>) {
    setParams((p) => ({ ...p, n3: Number(e.target.value) }));
    setPreset("Custom");
  }

  const presetOptions = [...PRESETS.map((p) => p.label), "Custom"];

  return (
    <PlayShell
      slug="superformula"
      title="Superformula"
      visualLabel="Animated canvas showing a Gielis superformula curve morphing between flower, star, gear, and blob shapes"
      controls={
        <>
          <div className="flex items-center gap-2">
            <label htmlFor="sf-preset-select" id={presetLabelId} className={labelClass}>
              preset
            </label>
            <select
              id="sf-preset-select"
              aria-labelledby={presetLabelId}
              value={preset}
              onChange={handlePreset}
              className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {presetOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span id={mLabelId} className={labelClass}>
              m
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={params.m}
              onChange={handleM}
              className={sliderClass}
              aria-labelledby={mLabelId}
              aria-valuemin={1}
              aria-valuemax={20}
              aria-valuenow={params.m}
            />
            <span className={valueLabelClass}>{params.m}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={n1LabelId} className={labelClass}>
              n1
            </span>
            <input
              type="range"
              min={0.1}
              max={8}
              step={0.1}
              value={params.n1}
              onChange={handleN1}
              className={sliderClass}
              aria-labelledby={n1LabelId}
              aria-valuemin={0.1}
              aria-valuemax={8}
              aria-valuenow={params.n1}
            />
            <span className={valueLabelClass}>{params.n1.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={n2LabelId} className={labelClass}>
              n2
            </span>
            <input
              type="range"
              min={0.1}
              max={8}
              step={0.1}
              value={params.n2}
              onChange={handleN2}
              className={sliderClass}
              aria-labelledby={n2LabelId}
              aria-valuemin={0.1}
              aria-valuemax={8}
              aria-valuenow={params.n2}
            />
            <span className={valueLabelClass}>{params.n2.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={n3LabelId} className={labelClass}>
              n3
            </span>
            <input
              type="range"
              min={0.1}
              max={8}
              step={0.1}
              value={params.n3}
              onChange={handleN3}
              className={sliderClass}
              aria-labelledby={n3LabelId}
              aria-valuemin={0.1}
              aria-valuemax={8}
              aria-valuenow={params.n3}
            />
            <span className={valueLabelClass}>{params.n3.toFixed(1)}</span>
          </div>
        </>
      }
      attribution={
        <>
          Technique: Gielis superformula polar curve. Formula from{" "}
          <a
            href="https://en.wikipedia.org/wiki/Superformula"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Wikipedia: Superformula
          </a>
          , originally by Johan Gielis.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated canvas showing a Gielis superformula curve. The shape morphs smoothly between flower, star, gear, and blob forms as parameters change. Use the sliders and preset selector in the controls bar to adjust the shape."
        suppressHydrationWarning
        style={{ background: isLight ? LIGHT_BG : DARK_BG }}
      />
    </PlayShell>
  );
}
