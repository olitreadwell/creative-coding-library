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

const DEFAULT_PARTICLE_COUNT = 2000;
const DEFAULT_FIELD_SCALE = 0.0035;
const DEFAULT_SPEED = 1.8;

const MIN_PARTICLE_COUNT = 200;
const MAX_PARTICLE_COUNT = 4000;
const STEP_PARTICLE_COUNT = 100;

const MIN_FIELD_SCALE = 0.001;
const MAX_FIELD_SCALE = 0.01;
const STEP_FIELD_SCALE = 0.0005;

const MIN_SPEED = 0.3;
const MAX_SPEED = 4;
const STEP_SPEED = 0.1;

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
  const [seed, setSeed] = useState<string>(() => randomSeedString());
  const [particleCount, setParticleCount] = useState<number>(DEFAULT_PARTICLE_COUNT);
  const [fieldScale, setFieldScale] = useState<number>(DEFAULT_FIELD_SCALE);
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEED);
  const { resolvedTheme } = useTheme();
  // Guard undefined (SSR / hydrating). Default to "dark" so the canvas
  // renders correctly before next-themes resolves on the client.
  const theme = (resolvedTheme ?? "dark") as "light" | "dark";
  const isLight = theme === "light";

  // Keep fieldScale and speed in refs so the animation loop always sees the
  // latest value without needing to be recreated on every slider change.
  const fieldScaleRef = useRef(fieldScale);
  const speedRef = useRef(speed);
  useEffect(() => {
    fieldScaleRef.current = fieldScale;
  }, [fieldScale]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const initField = useCallback(
    (width: number, height: number, seedStr: string, light: boolean, count: number) => {
      const numericSeed = seedFromString(seedStr);
      const perlin = makePerlinNoise2D(numericSeed);
      const rng = makeRng(numericSeed + 1);
      const particles = makeParticles(rng, count, width, height);
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
      initField(cv.clientWidth, cv.clientHeight, seed, isLight, particleCount);
    };

    fitCanvas();
    const ro = new ResizeObserver(fitCanvas);
    ro.observe(cv);
    return () => ro.disconnect();
    // resolvedTheme in deps so switching theme re-initialises the canvas.
    // particleCount in deps so changing the slider re-spawns particles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, initField, resolvedTheme, particleCount]);

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
      const currentFieldScale = fieldScaleRef.current;
      const currentSpeed = speedRef.current;

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

        const angle = flowAngle(perlin, p.x, p.y, currentFieldScale);
        const next = stepParticle(p, angle, currentSpeed, width, height);

        const strokeAlpha = light ? LIGHT_STROKE_ALPHA : DARK_STROKE_ALPHA;
        const color = particleColor(i, p.x, width, activeTheme, strokeAlpha);

        // A wrapped step jumps a full canvas dimension; drawing that segment
        // would streak a line across the screen, so skip it and just relocate.
        const wrapped =
          Math.abs(next.x - p.x) > currentSpeed * 2 || Math.abs(next.y - p.y) > currentSpeed * 2;
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
    // Reduced motion: flow fields need accumulation, so compose a settled still
    // from a few hundred synchronous frames instead of one near-empty frame.
    { pauseWhenHidden: true, reducedMotionFrames: 280 },
  );

  function handleNewSeed() {
    setSeed(randomSeedString());
  }

  function handleParticleCount(e: React.ChangeEvent<HTMLInputElement>) {
    setParticleCount(Number(e.target.value));
  }

  function handleFieldScale(e: React.ChangeEvent<HTMLInputElement>) {
    setFieldScale(Number(e.target.value));
  }

  function handleSpeed(e: React.ChangeEvent<HTMLInputElement>) {
    setSpeed(Number(e.target.value));
  }

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const labelClass = "text-xs text-foreground/70";

  const valueLabelClass = "w-10 text-right text-xs text-foreground/70 tabular-nums";

  const particleCountLabelId = "particle-count-label";
  const fieldScaleLabelId = "field-scale-label";
  const speedLabelId = "speed-label";

  return (
    <PlayShell
      slug="noise-field"
      title="Noise Field"
      visualLabel="Animated canvas showing thousands of particles streaming through a Perlin noise flow field"
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={particleCountLabelId} className={labelClass}>
              particles
            </span>
            <input
              type="range"
              min={MIN_PARTICLE_COUNT}
              max={MAX_PARTICLE_COUNT}
              step={STEP_PARTICLE_COUNT}
              value={particleCount}
              onChange={handleParticleCount}
              className={sliderClass}
              aria-labelledby={particleCountLabelId}
              aria-valuemin={MIN_PARTICLE_COUNT}
              aria-valuemax={MAX_PARTICLE_COUNT}
              aria-valuenow={particleCount}
            />
            <span className={valueLabelClass}>{particleCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={fieldScaleLabelId} className={labelClass}>
              scale
            </span>
            <input
              type="range"
              min={MIN_FIELD_SCALE}
              max={MAX_FIELD_SCALE}
              step={STEP_FIELD_SCALE}
              value={fieldScale}
              onChange={handleFieldScale}
              className={sliderClass}
              aria-labelledby={fieldScaleLabelId}
              aria-valuemin={MIN_FIELD_SCALE}
              aria-valuemax={MAX_FIELD_SCALE}
              aria-valuenow={fieldScale}
            />
            <span className={valueLabelClass}>{fieldScale.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={speedLabelId} className={labelClass}>
              speed
            </span>
            <input
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={STEP_SPEED}
              value={speed}
              onChange={handleSpeed}
              className={sliderClass}
              aria-labelledby={speedLabelId}
              aria-valuemin={MIN_SPEED}
              aria-valuemax={MAX_SPEED}
              aria-valuenow={speed}
            />
            <span className={valueLabelClass}>{speed.toFixed(1)}</span>
          </div>
          <button
            type="button"
            onClick={handleNewSeed}
            className={btnClass}
            aria-label="Regenerate the flow field with a new random seed"
          >
            New seed
          </button>
        </>
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
        aria-label="Animated canvas showing thousands of particles streaming through a Perlin noise flow field. Use the sliders to adjust particle count, field scale, and speed."
        suppressHydrationWarning
        style={{ background: isLight ? LIGHT_BG : DARK_BG }}
      />
    </PlayShell>
  );
}
