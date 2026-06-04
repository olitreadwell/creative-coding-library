"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
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

// Light theme: ink-on-paper. Source-over blend, deep strokes on
// a near-white canvas with a low-alpha light fade each frame.
const LIGHT_BG = "#f5f4f0";
const LIGHT_TRAIL_ALPHA = 0.04;
const LIGHT_STROKE_ALPHA = 0.45;

// Number of colorblind-safe palette entries (CB_ON_DARK and CB_ON_LIGHT each
// have 6). Particles cycle through them; position within the field blends
// between two adjacent entries so the flow still shifts across the canvas.
const CB_PALETTE_SIZE = 6;

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

/**
 * Resolve a colorblind-safe stroke color for the i-th particle at position x.
 * x / width maps position to a blend between palette entry i and i+1, so the
 * flow field still exhibits a gradient across the canvas while remaining
 * protanopia-safe. Alpha is applied via rgba() wrapping the hex color.
 */
function particleColor(
  i: number,
  x: number,
  width: number,
  theme: "light" | "dark",
  alpha: number,
): string {
  // Cycle the palette index by particle index, then blend toward the next
  // entry based on horizontal position — preserves the left-to-right hue shift
  // without using red/green hue arithmetic.
  const idxA = i % CB_PALETTE_SIZE;
  const idxB = (i + 1) % CB_PALETTE_SIZE;
  const t = map(x, 0, width, 0, 1);

  const colorA = cbColor(idxA, theme);
  const colorB = cbColor(idxB, theme);

  // Lerp the two hex colors in RGB space.
  const rA = parseInt(colorA.slice(1, 3), 16);
  const gA = parseInt(colorA.slice(3, 5), 16);
  const bA = parseInt(colorA.slice(5, 7), 16);
  const rB = parseInt(colorB.slice(1, 3), 16);
  const gB = parseInt(colorB.slice(3, 5), 16);
  const bB = parseInt(colorB.slice(5, 7), 16);

  const r = Math.round(rA + (rB - rA) * t);
  const g = Math.round(gA + (gB - gA) * t);
  const b = Math.round(bA + (bB - bA) * t);

  return `rgba(${r},${g},${b},${alpha})`;
}

export default function NoiseFieldPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FieldState | null>(null);
  const [seed, setSeed] = useState<string>("noise-field");
  const { resolvedTheme } = useTheme();
  // Guard undefined (SSR / hydrating). Default to "dark" so the canvas
  // renders correctly before next-themes resolves on the client.
  const theme = (resolvedTheme ?? "dark") as "light" | "dark";
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
      const activeTheme: "light" | "dark" = light ? "light" : "dark";

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

      // Light theme: normal blend. Dark theme: additive so overlapping
      // strokes build up a glow without blowing out on a light canvas.
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;

        const angle = flowAngle(perlin, p.x, p.y, FIELD_SCALE);
        const next = stepParticle(p, angle, SPEED, width, height);

        const strokeAlpha = light ? LIGHT_STROKE_ALPHA : DARK_STROKE_ALPHA;
        const color = particleColor(i, p.x, width, activeTheme, strokeAlpha);

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

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="noise-field"
      title="Noise Field"
      visualLabel="Animated canvas showing thousands of particles streaming through a Perlin noise flow field"
      controls={
        <button
          type="button"
          onClick={handleNewSeed}
          className={btnClass}
          aria-label="Regenerate the flow field with a new random seed"
        >
          New seed
        </button>
      }
      attribution={
        <>
          Technique: Perlin flow field + particle trails. Concept from{" "}
          <a
            href="https://natureofcode.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            The Nature of Code
          </a>{" "}
          by Daniel Shiffman.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated canvas showing thousands of particles streaming through a Perlin noise flow field. No interactive controls."
        style={{ background: isLight ? LIGHT_BG : DARK_BG }}
      />
    </PlayShell>
  );
}
