"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { makePerlinNoise2D, type PerlinNoise2D } from "@/lib/creative/noise";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { flowAngle, makeParticles, stepParticle, type Particle } from "../field";

const PARTICLE_COUNT = 2000;
const FIELD_SCALE = 0.0035;
const SPEED = 1.8;

// Dark theme: additive glow on a near-black background.
const DARK_BG = "#050a12";
const DARK_TRAIL_ALPHA = 0.018;
const DARK_STROKE_ALPHA = 0.55;
const DARK_BASE_HUE = 200;
const DARK_HUE_RANGE = 160;

// Light theme: ink-on-paper. Source-over blend, deep blue/indigo strokes on
// a near-white canvas with a low-alpha light fade each frame.
const LIGHT_BG = "#f5f4f0";
const LIGHT_TRAIL_ALPHA = 0.04;
const LIGHT_STROKE_ALPHA = 0.45;
const LIGHT_BASE_HUE = 225;
const LIGHT_HUE_RANGE = 60;

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

export default function NoiseFieldPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FieldState | null>(null);
  const [seed, setSeed] = useState<string>("noise-field");
  const { resolvedTheme } = useTheme();
  // Guard undefined (SSR / hydrating). Default to "dark" so the canvas
  // renders correctly before next-themes resolves on the client.
  const theme = resolvedTheme ?? "dark";
  const isLight = theme === "light";

  const initField = useCallback(
    (width: number, height: number, seedStr: string, light: boolean) => {
      const numericSeed = seedFromString(seedStr);
      const perlin = makePerlinNoise2D(numericSeed);
      const rng = makeRng(numericSeed + 1);
      const particles = makeParticles(rng, PARTICLE_COUNT, width, height);
      stateRef.current = { perlin, particles, width, height };

      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = light ? LIGHT_BG : DARK_BG;
      ctx.fillRect(0, 0, width, height);
    },
    [],
  );

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
      initField(cv.clientWidth, cv.clientHeight, seed, isLight);
    };

    fitCanvas();
    const ro = new ResizeObserver(fitCanvas);
    ro.observe(cv);
    return () => ro.disconnect();
    // resolvedTheme in deps so switching theme re-initialises the canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, initField, resolvedTheme]);

  // Capture isLight in a ref so the animation loop always sees the latest
  // value without needing to be recreated on every theme change.
  const isLightRef = useRef(isLight);
  useEffect(() => {
    isLightRef.current = isLight;
  }, [isLight]);

  useAnimationFrame(
    useCallback(() => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const state = stateRef.current;
      if (!state) return;

      const { perlin, particles, width, height } = state;
      const light = isLightRef.current;

      // Fade the canvas each frame to build trailing ink lines.
      ctx.globalCompositeOperation = "source-over";
      if (light) {
        // Light: fade toward near-white so dark strokes leave ink trails.
        ctx.fillStyle = `rgba(245, 244, 240, ${LIGHT_TRAIL_ALPHA})`;
      } else {
        // Dark: fade toward near-black so glowing strokes build up.
        ctx.fillStyle = `rgba(5, 10, 18, ${DARK_TRAIL_ALPHA})`;
      }
      ctx.fillRect(0, 0, width, height);

      // Light theme: normal blend — additive glow reads as blown-out white on
      // a light canvas. Dark theme: additive so overlapping strokes glow.
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;

        const angle = flowAngle(perlin, p.x, p.y, FIELD_SCALE);
        const next = stepParticle(p, angle, SPEED, width, height);

        // Map horizontal position to a hue so the field shifts across the
        // spectrum as particles drift left to right.
        let color: string;
        if (light) {
          // Deep blue/indigo range — narrow hue span keeps it ink-like.
          const hue = map(p.x, 0, width, LIGHT_BASE_HUE, LIGHT_BASE_HUE + LIGHT_HUE_RANGE);
          // Low lightness (0.22) gives dark, saturated strokes on the pale BG.
          color = hslString(hsl(hue, 0.75, 0.22), LIGHT_STROKE_ALPHA);
        } else {
          const hue = map(p.x, 0, width, DARK_BASE_HUE, DARK_BASE_HUE + DARK_HUE_RANGE);
          color = hslString(hsl(hue, 0.85, 0.62), DARK_STROKE_ALPHA);
        }

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

  // Theme-aware chrome classes. Light uses dark-on-light tokens; dark keeps
  // the existing near-black chrome with white text. Both pass AA contrast.
  const chromeBase = isLight ? "bg-stone-100 text-stone-800" : "bg-black text-foreground";
  const borderClass = isLight ? "border-stone-300" : "border-white/10";
  const linkClass = isLight
    ? "text-stone-600 hover:text-stone-900"
    : "text-white/70 hover:text-white";
  const titleClass = isLight ? "text-stone-800" : "text-white/90";
  const btnClass = isLight
    ? "border-stone-400 hover:border-stone-600 text-stone-700 hover:text-stone-900 focus-visible:ring-stone-500"
    : "border-white/30 hover:border-white/60 text-white/80 hover:text-white focus-visible:ring-white/70";
  const footerTextClass = isLight ? "text-stone-500" : "text-white/70";

  return (
    <main className={`min-h-screen flex flex-col ${chromeBase}`}>
      {/* Header: wraps on narrow viewports; no overflow. */}
      <header
        className={`px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between border-b ${borderClass} shrink-0`}
      >
        <nav aria-label="Back navigation">
          <Link
            href="/noise-field"
            aria-label="Back to Noise Field"
            className={`inline-flex items-center gap-1 text-sm underline underline-offset-2
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded
                        ${linkClass}`}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back
          </Link>
        </nav>
        <h1 className={`text-sm font-medium tracking-wide ${titleClass}`}>Noise Field — Live</h1>
        <button
          type="button"
          onClick={handleNewSeed}
          className={`text-sm px-3 py-1 rounded border transition-colors
                      focus-visible:outline-none focus-visible:ring-2 ${btnClass}`}
          aria-label="Regenerate the flow field with a new random seed"
        >
          New seed
        </button>
      </header>

      {/* Canvas stage: background matches the current theme's canvas BG. */}
      <section className="flex-1 relative" aria-label="Perlin noise flow field animation">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-label="Animated canvas showing thousands of particles streaming through a Perlin noise flow field. No interactive controls."
          style={{ background: isLight ? LIGHT_BG : DARK_BG }}
        />
      </section>

      <footer className={`px-4 py-3 text-xs border-t ${borderClass} shrink-0 ${footerTextClass}`}>
        Technique: Perlin flow field + particle trails. Concept from{" "}
        <a
          href="https://natureofcode.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 hover:opacity-80
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded`}
        >
          The Nature of Code
        </a>{" "}
        by Daniel Shiffman.
      </footer>
    </main>
  );
}
