"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
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
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const canvasBg = theme === "dark" ? "#000000" : "#f8f8f8";

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

  return (
    <PlayShell
      slug="boids"
      title="Boids"
      visualLabel="Animated flock of triangles steering together using separation, alignment, and cohesion"
      controls={
        <>
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
        style={{ background: canvasBg }}
      />
    </PlayShell>
  );
}
