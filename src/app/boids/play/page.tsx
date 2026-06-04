"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { hsl, hslString } from "@/lib/creative/color";
import { TAU } from "@/lib/creative/math";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { makeBoids, stepBoids, DEFAULT_OPTS } from "../boids";
import type { Boid } from "../boids";

/** Number of boids in the flock. */
const FLOCK_SIZE = 120;

/** Size of each boid triangle (half-length along heading axis). */
const BOID_HALF_LEN = 7;
const BOID_HALF_WIDTH = 3;

/** Generates a numeric seed from the current timestamp. */
function freshSeed(): number {
  return Date.now() & 0xffffffff;
}

/**
 * Maps a boid's heading angle + speed to a theme-aware HSL color string.
 *
 * Dark theme: vivid, bright colors on a dark background.
 * Light theme: deep, saturated colors on a light background (AA contrast).
 */
function boidColor(
  vx: number,
  vy: number,
  minSpeed: number,
  maxSpeed: number,
  isDark: boolean,
): string {
  const angle = Math.atan2(vy, vx);
  const hue = ((angle / TAU) * 360 + 360) % 360;
  const speed = Math.sqrt(vx * vx + vy * vy);
  const t = maxSpeed === minSpeed ? 0 : (speed - minSpeed) / (maxSpeed - minSpeed);

  if (isDark) {
    // Vivid, high-lightness on dark background.
    return hslString(hsl(hue, 0.9, 0.55 + t * 0.2));
  }
  // Deep, saturated, lower-lightness on light background for AA contrast.
  return hslString(hsl(hue, 1.0, 0.25 + t * 0.2));
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

  // next-themes: guard undefined during SSR/hydration, default to 'dark'.
  const { resolvedTheme } = useTheme();
  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";
  const isDark = theme === "dark";

  // Theme-aware color tokens.
  const pageBg = isDark ? "bg-black text-white" : "bg-background text-foreground";
  const borderColor = isDark ? "border-white/10" : "border-border";
  const mutedText = isDark ? "text-white/70" : "text-foreground/60";
  const headingText = isDark ? "text-white/80" : "text-foreground/80";
  const btnBorder = isDark
    ? "border-white/25 text-white/80 hover:border-white/60 hover:text-white focus-visible:ring-white/70"
    : "border-border text-foreground/70 hover:border-foreground/50 hover:text-foreground focus-visible:ring-foreground/40";
  const canvasBg = isDark ? "#000000" : "#f8f8f8";

  // Initialize boids when seed or canvas size changes.
  useEffect(() => {
    if (!size) return;
    const rng = makeRng(seed);
    boidsRef.current = makeBoids(rng, FLOCK_SIZE, size.w, size.h);
  }, [seed, size]);

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

    // Step the flock in CSS-pixel space.
    boidsRef.current = stepBoids(boidsRef.current, DEFAULT_OPTS, size.w, size.h);

    const dpr = window.devicePixelRatio ?? 1;

    // Clear.
    ctx.resetTransform();
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale to DPR so boid coordinates (CSS pixels) map correctly.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const b of boidsRef.current) {
      const color = boidColor(b.vx, b.vy, DEFAULT_OPTS.minSpeed, DEFAULT_OPTS.maxSpeed, isDark);
      drawBoid(ctx, b, color);
    }
  });

  const handleReseed = useCallback(() => {
    setSeed(freshSeed());
  }, []);

  return (
    <main className={`min-h-screen flex flex-col ${pageBg}`}>
      <header
        className={`px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3 border-b ${borderColor} shrink-0`}
      >
        <nav aria-label="Page navigation" className="flex-none">
          <Link
            href="/boids"
            className={`inline-flex items-center gap-1 text-sm ${mutedText} hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/40 rounded`}
            aria-label="Back to Boids detail page"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
        </nav>

        <h1 className={`flex-1 text-sm font-medium tracking-wide text-center ${headingText}`}>
          Boids
        </h1>

        <div className="flex-none">
          <button
            type="button"
            onClick={handleReseed}
            className={`text-sm px-3 py-1 rounded border ${btnBorder} transition-colors focus-visible:outline-none focus-visible:ring-2`}
            aria-label="Spawn a new flock with a random seed"
          >
            New flock
          </button>
        </div>
      </header>

      <section
        className="flex-1 relative"
        aria-label="Boids flock simulation. Triangles flock together using three steering rules: separation, alignment, and cohesion."
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="Animated boids flock. Each triangle is a boid steered by separation, alignment, and cohesion."
        />
      </section>

      <footer className={`px-6 py-4 text-xs ${mutedText} border-t ${borderColor} shrink-0`}>
        Reynolds boids algorithm.{" "}
        <a
          href="https://www.red3d.com/cwr/boids/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-70"
        >
          Original 1987 paper by Craig Reynolds
        </a>
        . This implementation is MIT licensed.
      </footer>
    </main>
  );
}
