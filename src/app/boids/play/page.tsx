"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { makeBoids, stepBoids, DEFAULT_OPTS } from "../boids";
import type { Boid, BoidsOpts } from "../boids";

/** Size of each boid triangle (half-length along heading axis). */
const BOID_HALF_LEN = 4;
const BOID_HALF_WIDTH = 2;

const MIN_FLOCK_SIZE = 50;
const MAX_FLOCK_SIZE = 400;
const DEFAULT_FLOCK_SIZE = 120;

/** Generates a numeric seed from the current timestamp. */
function freshSeed(): number {
  return Date.now() & 0xffffffff;
}

/**
 * Draws a single boid as an oriented triangle on `ctx`.
 *
 * The triangle points in the direction of (vx, vy).
 */
function drawBoid(ctx: CanvasRenderingContext2D, b: Boid, color: string): void {
  const angle = Math.atan2(b.vy, b.vx);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Three triangle vertices in local space, then rotated + translated.
  // Tip: forward along heading.
  const tipX = b.x + cos * BOID_HALF_LEN;
  const tipY = b.y + sin * BOID_HALF_LEN;
  // Left wing.
  const leftX = b.x + (-cos * BOID_HALF_LEN + sin * BOID_HALF_WIDTH);
  const leftY = b.y + (-sin * BOID_HALF_LEN - cos * BOID_HALF_WIDTH);
  // Right wing.
  const rightX = b.x + (-cos * BOID_HALF_LEN - sin * BOID_HALF_WIDTH);
  const rightY = b.y + (-sin * BOID_HALF_LEN + cos * BOID_HALF_WIDTH);

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export default function BoidsPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boidsRef = useRef<Boid[]>([]);
  const [seed, setSeed] = useState<number>(() => freshSeed());
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Configurable simulation parameters — defaults match the hard-coded originals.
  const [flockSize, setFlockSize] = useState<number>(DEFAULT_FLOCK_SIZE);
  const [separationWeight, setSeparationWeight] = useState<number>(DEFAULT_OPTS.separationWeight);
  const [alignmentWeight, setAlignmentWeight] = useState<number>(DEFAULT_OPTS.alignmentWeight);
  const [cohesionWeight, setCohesionWeight] = useState<number>(DEFAULT_OPTS.cohesionWeight);
  const [maxSpeed, setMaxSpeed] = useState<number>(DEFAULT_OPTS.maxSpeed);

  // Ref so the animation loop always reads the latest opts without re-subscribing.
  const optsRef = useRef<BoidsOpts>({ ...DEFAULT_OPTS });
  useEffect(() => {
    optsRef.current = {
      ...DEFAULT_OPTS,
      separationWeight,
      alignmentWeight,
      cohesionWeight,
      maxSpeed,
      // Keep minSpeed proportional: cap it just below maxSpeed if slider goes low.
      minSpeed: Math.min(DEFAULT_OPTS.minSpeed, maxSpeed * 0.85),
    };
  }, [separationWeight, alignmentWeight, cohesionWeight, maxSpeed]);

  // next-themes: guard undefined during SSR/hydration, default to 'dark'.
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const canvasBg = theme === "dark" ? "#000000" : "#f8f8f8";

  // Initialize boids when seed, flock size, or canvas size changes.
  useEffect(() => {
    if (!size) return;
    const rng = makeRng(seed);
    boidsRef.current = makeBoids(rng, flockSize, size.w, size.h);
  }, [seed, flockSize, size]);

  // Fit canvas to its CSS box, apply DPR, observe resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      const dpr = window.devicePixelRatio ?? 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      // Simulation runs in CSS pixels so boids aren't tiny on HiDPI screens.
      setSize({ w: cssW, h: cssH });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Animation loop: step simulation then draw.
  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Step the flock in CSS-pixel space using the live opts ref.
    boidsRef.current = stepBoids(boidsRef.current, optsRef.current, size.w, size.h);

    const dpr = window.devicePixelRatio ?? 1;

    // Clear.
    ctx.resetTransform();
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale to DPR so boid coordinates (CSS pixels) map correctly.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Use Okabe-Ito colorblind-safe palette, cycling by boid index.
    boidsRef.current.forEach((b, i) => {
      const color = cbColor(i, theme);
      drawBoid(ctx, b, color);
    });
  });

  const handleReseed = useCallback(() => {
    setSeed(freshSeed());
  }, []);

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const labelClass = "text-xs text-foreground/70 w-16 shrink-0";
  const valueClass = "w-8 text-right text-xs text-foreground/70 tabular-nums";
  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="boids"
      title="Boids"
      visualLabel="Animated flock of triangles steering together using separation, alignment, and cohesion"
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id="boids-separation-label" className={labelClass}>
              separation
            </span>
            <input
              type="range"
              min={0}
              max={2.5}
              step={0.1}
              value={separationWeight}
              onChange={(e) => setSeparationWeight(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="boids-separation-label"
              aria-valuemin={0}
              aria-valuemax={2.5}
              aria-valuenow={separationWeight}
            />
            <span className={valueClass}>{separationWeight.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id="boids-alignment-label" className={labelClass}>
              alignment
            </span>
            <input
              type="range"
              min={0}
              max={2.5}
              step={0.1}
              value={alignmentWeight}
              onChange={(e) => setAlignmentWeight(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="boids-alignment-label"
              aria-valuemin={0}
              aria-valuemax={2.5}
              aria-valuenow={alignmentWeight}
            />
            <span className={valueClass}>{alignmentWeight.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id="boids-cohesion-label" className={labelClass}>
              cohesion
            </span>
            <input
              type="range"
              min={0}
              max={2.5}
              step={0.1}
              value={cohesionWeight}
              onChange={(e) => setCohesionWeight(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="boids-cohesion-label"
              aria-valuemin={0}
              aria-valuemax={2.5}
              aria-valuenow={cohesionWeight}
            />
            <span className={valueClass}>{cohesionWeight.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id="boids-maxspeed-label" className={labelClass}>
              max speed
            </span>
            <input
              type="range"
              min={1}
              max={8}
              step={0.5}
              value={maxSpeed}
              onChange={(e) => setMaxSpeed(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="boids-maxspeed-label"
              aria-valuemin={1}
              aria-valuemax={8}
              aria-valuenow={maxSpeed}
            />
            <span className={valueClass}>{maxSpeed.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id="boids-count-label" className={labelClass}>
              boids
            </span>
            <input
              type="range"
              min={MIN_FLOCK_SIZE}
              max={MAX_FLOCK_SIZE}
              step={10}
              value={flockSize}
              onChange={(e) => setFlockSize(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="boids-count-label"
              aria-valuemin={MIN_FLOCK_SIZE}
              aria-valuemax={MAX_FLOCK_SIZE}
              aria-valuenow={flockSize}
            />
            <span className={valueClass}>{flockSize}</span>
          </div>
          <button
            type="button"
            onClick={handleReseed}
            className={btnClass}
            aria-label="Spawn a new flock with a random seed"
          >
            New flock
          </button>
        </>
      }
      attribution={
        <>
          Reynolds boids algorithm.{" "}
          <a
            href="https://www.red3d.com/cwr/boids/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Original 1987 paper by Craig Reynolds
          </a>
          . This implementation is MIT licensed.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated boids flock. Each triangle is a boid steered by separation, alignment, and cohesion."
        suppressHydrationWarning
        style={{ background: canvasBg }}
      />
    </PlayShell>
  );
}
