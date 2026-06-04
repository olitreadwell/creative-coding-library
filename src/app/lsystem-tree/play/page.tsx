"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { hsl, hslString } from "@/lib/creative/color";
import { clamp, map } from "@/lib/creative/math";
import { makeRng } from "@/lib/creative/random";
import { expand, turtleSegments, type Segment } from "../lsystem";

const AXIOM = "X";
const RULES: Record<string, string> = {
  X: "F+[[X]-X]-F[-FX]+X",
  F: "FF",
};
const TURN_DEG = 25;
const JITTER_DEG = 4;
const MAX_DEPTH = 12;
const TRUNK_HUE = 30;
const TRUNK_SAT = 0.55;
const TRUNK_LIT = 0.28;
const TIP_HUE = 115;
const TIP_SAT = 0.6;
const TIP_LIT = 0.42;
const BG_DARK = "#0d1117";
const BG_LIGHT = "#f8f6f0";

type CanvasSize = { width: number; height: number };

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

function stepLenForIterations(iterations: number, height: number): number {
  // Each F doubles per iteration so the string grows as 2^n.
  // Scale step length down to keep the tree inside the canvas.
  const base = height * 0.32;
  return base / Math.pow(2, iterations - 1);
}

function segmentColor(seg: Segment, maxDepth: number): string {
  const t = maxDepth > 0 ? clamp(seg.depth / maxDepth, 0, 1) : 0;
  const h = map(t, 0, 1, TRUNK_HUE, TIP_HUE);
  const s = map(t, 0, 1, TRUNK_SAT, TIP_SAT);
  const l = map(t, 0, 1, TRUNK_LIT, TIP_LIT);
  return hslString(hsl(h, s, l));
}

function segmentWidth(seg: Segment, maxDepth: number): number {
  const t = maxDepth > 0 ? clamp(seg.depth / maxDepth, 0, 1) : 0;
  return map(t, 0, 1, 4, 0.5);
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  seed: number,
  iterations: number,
  bgColor: string,
): void {
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size.width, size.height);

  const commands = expand(AXIOM, RULES, iterations);
  const rng = makeRng(seed);
  const stepLen = stepLenForIterations(iterations, size.height);

  const segments = turtleSegments(commands, {
    startX: size.width * 0.5,
    startY: size.height * 0.92,
    startAngle: -Math.PI / 2, // point upward
    stepLen,
    turnDeg: TURN_DEG,
    rng,
    jitterDeg: JITTER_DEG,
  });

  // Find actual max depth for color mapping
  let maxDepth = 1;
  for (const seg of segments) {
    if (seg.depth > maxDepth) maxDepth = seg.depth;
  }
  const cappedMax = Math.min(maxDepth, MAX_DEPTH);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const seg of segments) {
    ctx.beginPath();
    ctx.strokeStyle = segmentColor(seg, cappedMax);
    ctx.lineWidth = segmentWidth(seg, cappedMax);
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
  }
}

export default function LSystemTreePage(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState<number>(() => 0x1a2b3c4d);
  const [iterations, setIterations] = useState<number>(5);
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const { resolvedTheme } = useTheme();

  // Determine background color from the resolved theme.
  // Guard undefined (SSR / theme not yet resolved) with a safe default.
  const bgColor =
    resolvedTheme === undefined ? BG_DARK : resolvedTheme === "light" ? BG_LIGHT : BG_DARK;

  // ResizeObserver: update size state when the canvas element resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      setSize({ width: Math.round(width), height: Math.round(height) });
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Draw whenever seed, iterations, canvas size, or theme changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    drawTree(ctx, size, seed, iterations, bgColor);
    ctx.restore();
  }, [seed, iterations, size, bgColor]);

  const handleReroll = useCallback(() => {
    setSeed(randomSeed());
  }, []);

  const handleIterations = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIterations(clamp(Number(e.target.value), 1, 6));
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 border-b border-border flex-wrap">
        <nav aria-label="Breadcrumb">
          <Link
            href="/lsystem-tree"
            className="text-sm text-foreground/70 hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            &larr; L-System Tree
          </Link>
        </nav>

        <h1 className="text-sm font-medium tracking-wide text-foreground/80 mr-auto">
          L-System Tree — play
        </h1>

        <div className="flex items-center gap-4 flex-wrap">
          <label
            htmlFor="iterations-slider"
            className="flex items-center gap-2 text-sm text-foreground/70"
          >
            <span>Iterations</span>
            <input
              id="iterations-slider"
              type="range"
              min={1}
              max={6}
              value={iterations}
              onChange={handleIterations}
              className="w-24 accent-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-valuemin={1}
              aria-valuemax={6}
              aria-valuenow={iterations}
              aria-label="Number of L-system expansion iterations"
            />
            <span className="w-4 text-right text-foreground/80 tabular-nums" aria-live="polite">
              {iterations}
            </span>
          </label>

          <button
            type="button"
            onClick={handleReroll}
            className="text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Re-roll with a new random seed"
          >
            Re-roll
          </button>
        </div>
      </header>

      <section className="flex-1 relative" aria-label="L-system fractal plant canvas">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="L-system fractal plant. Use the Iterations slider to control depth. Use Re-roll to randomize branch jitter."
          style={{ background: bgColor }}
        />
      </section>

      <footer className="px-4 py-3 sm:px-6 sm:py-4 text-xs text-foreground/70 border-t border-border">
        Technique: L-system expansion + turtle graphics. Based on the work of{" "}
        <a
          href="https://en.wikipedia.org/wiki/Aristid_Lindenmayer"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          Aristid Lindenmayer
        </a>
        .
      </footer>
    </main>
  );
}
