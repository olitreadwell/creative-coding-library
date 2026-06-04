"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { makePerlinNoise2D, type PerlinNoise2D } from "@/lib/creative/noise";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { flowAngle, makeParticles, stepParticle, type Particle } from "./field";

const PARTICLE_COUNT = 2000;
const FIELD_SCALE = 0.0035;
const SPEED = 1.8;
const TRAIL_ALPHA = 0.018;
const STROKE_ALPHA = 0.55;
const BASE_HUE = 200;
const HUE_RANGE = 160;

type FieldState = {
  perlin: PerlinNoise2D;
  particles: Particle[];
  width: number;
  height: number;
};

function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function randomSeedString(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function NoiseFieldPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FieldState | null>(null);
  const [seed, setSeed] = useState<string>("noise-field");

  const initField = useCallback((width: number, height: number, seedStr: string) => {
    const numericSeed = seedFromString(seedStr);
    const perlin = makePerlinNoise2D(numericSeed);
    const rng = makeRng(numericSeed + 1);
    const particles = makeParticles(rng, PARTICLE_COUNT, width, height);
    stateRef.current = { perlin, particles, width, height };

    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#050a12";
    ctx.fillRect(0, 0, width, height);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const fitCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth * dpr;
      const h = cv.clientHeight * dpr;
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      initField(cv.clientWidth, cv.clientHeight, seed);
    };

    fitCanvas();
    const ro = new ResizeObserver(fitCanvas);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, initField]);

  useAnimationFrame(
    useCallback(() => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const state = stateRef.current;
      if (!state) return;

      const { perlin, particles, width, height } = state;

      // Fade the canvas toward black each frame to build glowing trails.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(5, 10, 18, ${TRAIL_ALPHA})`;
      ctx.fillRect(0, 0, width, height);

      // Draw particles with additive blending so overlapping strokes glow.
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;

        const angle = flowAngle(perlin, p.x, p.y, FIELD_SCALE);
        const next = stepParticle(p, angle, SPEED, width, height);

        // Map horizontal position to a hue so the field shifts across the
        // spectrum as particles drift left to right.
        const hue = map(p.x, 0, width, BASE_HUE, BASE_HUE + HUE_RANGE);
        const color = hslString(hsl(hue, 0.85, 0.62), STROKE_ALPHA);

        // A wrapped step jumps a full canvas dimension; drawing that segment
        // would streak a line across the screen, so skip it and just relocate.
        const wrapped = Math.abs(next.x - p.x) > SPEED * 2 || Math.abs(next.y - p.y) > SPEED * 2;
        if (!wrapped) {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
        }

        particles[i] = next;
      }

      ctx.globalCompositeOperation = "source-over";
    }, []),
    { pauseWhenHidden: true, respectReducedMotion: true },
  );

  function handleNewSeed() {
    setSeed(randomSeedString());
  }

  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white underline underline-offset-2"
          >
            &larr; home
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide text-white/80">Noise Field</h1>
        <button
          type="button"
          onClick={handleNewSeed}
          className="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/50 text-white/70 hover:text-white transition-colors"
          aria-label="Regenerate with a new random seed"
        >
          New seed
        </button>
      </header>

      <section className="flex-1 relative" aria-label="Perlin noise flow field animation">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
          style={{ background: "#050a12" }}
        />
      </section>

      <footer className="px-6 py-4 text-xs text-white/30 border-t border-white/10">
        Technique: Perlin flow field + additive trails. Concept from{" "}
        <a
          href="https://natureofcode.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-white/60"
        >
          The Nature of Code
        </a>{" "}
        by Daniel Shiffman.
      </footer>
    </main>
  );
}
