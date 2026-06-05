"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColors } from "@/lib/creative/cbpalette";
import { makeRng } from "@/lib/creative/random";
import { subdivide } from "../subdivide";

const DARK_BG = "#111111";
const LIGHT_BG = "#f5f3ee";

const depthLabelId = "mondrian-depth-label";
const lineWeightLabelId = "mondrian-line-weight-label";
const colorAmountLabelId = "mondrian-color-amount-label";

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

function drawMondrian(
  canvas: HTMLCanvasElement,
  seed: number,
  depth: number,
  lineWeight: number,
  colorAmount: number,
  theme: "light" | "dark",
) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;

  if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const isLight = theme === "light";
  const bg = isLight ? LIGHT_BG : DARK_BG;
  const strokeColor = isLight ? "#111111" : "#eeeeee";
  const neutralFill = isLight ? "#f0ede5" : "#1a1a1a";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const rng = makeRng(seed);
  const palette = cbColors(theme);

  const root = { x: 0, y: 0, w: cssW, h: cssH };
  const leaves = subdivide(root, depth, rng);

  const colorRng = makeRng(seed + 1);

  for (const leaf of leaves) {
    if (colorRng() < colorAmount) {
      const idx = Math.floor(colorRng() * palette.length);
      ctx.fillStyle = palette[idx] ?? neutralFill;
    } else {
      ctx.fillStyle = neutralFill;
    }
    ctx.fillRect(leaf.x, leaf.y, leaf.w, leaf.h);
  }

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWeight;
  ctx.lineJoin = "miter";

  for (const leaf of leaves) {
    ctx.strokeRect(leaf.x, leaf.y, leaf.w, leaf.h);
  }
}

export default function MondrianPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState<number>(() => randomSeed());
  const [depth, setDepth] = useState<number>(4);
  const [lineWeight, setLineWeight] = useState<number>(6);
  const [colorAmount, setColorAmount] = useState<number>(0.35);
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "dark") as "light" | "dark";

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawMondrian(canvas, seed, depth, lineWeight, colorAmount, theme);
  }, [seed, depth, lineWeight, colorAmount, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    redraw();

    const ro = new ResizeObserver(() => {
      redraw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redraw]);

  function handleRegenerate() {
    setSeed(randomSeed());
  }

  function handlePointerDown() {
    setSeed(randomSeed());
  }

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const labelClass = "text-xs text-foreground/70";

  const valueLabelClass = "w-10 text-right text-xs text-foreground/70 tabular-nums";

  const bg = theme === "light" ? LIGHT_BG : DARK_BG;

  return (
    <PlayShell
      slug="mondrian"
      title="Mondrian"
      visualLabel="Canvas showing a Mondrian-style recursive rectangle composition. Click the canvas to generate a new composition."
      animated={false}
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={depthLabelId} className={labelClass}>
              depth
            </span>
            <input
              type="range"
              min={2}
              max={7}
              step={1}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={depthLabelId}
              aria-valuemin={2}
              aria-valuemax={7}
              aria-valuenow={depth}
            />
            <span className={valueLabelClass}>{depth}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={lineWeightLabelId} className={labelClass}>
              line weight
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={lineWeight}
              onChange={(e) => setLineWeight(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={lineWeightLabelId}
              aria-valuemin={1}
              aria-valuemax={20}
              aria-valuenow={lineWeight}
            />
            <span className={valueLabelClass}>{lineWeight}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={colorAmountLabelId} className={labelClass}>
              color
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={colorAmount}
              onChange={(e) => setColorAmount(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={colorAmountLabelId}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={colorAmount}
            />
            <span className={valueLabelClass}>{Math.round(colorAmount * 100)}%</span>
          </div>
          <button
            type="button"
            onClick={handleRegenerate}
            className={btnClass}
            aria-label="Regenerate the composition with a new random layout"
          >
            Regenerate
          </button>
        </>
      }
      attribution="Recursive rectangle subdivision, De Stijl / Mondrian style. Original concept by Piet Mondrian."
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-pointer"
        aria-label="Mondrian-style canvas. Click anywhere to generate a fresh composition."
        suppressHydrationWarning
        style={{ background: bg }}
        onPointerDown={handlePointerDown}
      />
    </PlayShell>
  );
}
