"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { KnobsPanel } from "@/components/learning/KnobsPanel";
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

const DARK_BG = "#050a12";
const DARK_TRAIL_ALPHA = 0.018;
const DARK_STROKE_ALPHA = 0.55;

const LIGHT_BG = "#f5f4f0";
const LIGHT_TRAIL_ALPHA = 0.04;
const LIGHT_STROKE_ALPHA = 0.45;

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

function particleColor(
  i: number,
  x: number,
  width: number,
  theme: "light" | "dark",
  alpha: number,
): string {
  const idxA = i % CB_PALETTE_SIZE;
  const idxB = (i + 1) % CB_PALETTE_SIZE;
  const t = map(x, 0, width, 0, 1);

  const colorA = cbColor(idxA, theme);
  const colorB = cbColor(idxB, theme);

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
  const theme = (resolvedTheme ?? "dark") as "light" | "dark";
  const isLight = theme === "light";

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

      ctx.globalCompositeOperation = "source-over";
      if (light) {
        ctx.fillStyle = `rgba(245, 244, 240, ${LIGHT_TRAIL_ALPHA})`;
      } else {
        ctx.fillStyle = `rgba(5, 10, 18, ${DARK_TRAIL_ALPHA})`;
      }
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = light ? "source-over" : "lighter";
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;

        const angle = flowAngle(perlin, p.x, p.y, currentFieldScale);
        const next = stepParticle(p, angle, currentSpeed, width, height);

        const strokeAlpha = light ? LIGHT_STROKE_ALPHA : DARK_STROKE_ALPHA;
        const color = particleColor(i, p.x, width, activeTheme, strokeAlpha);

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
    { pauseWhenHidden: true, reducedMotionFrames: 280 },
  );

  function handleKnobChange(key: string, value: number | string | boolean) {
    if (key === "particles" && typeof value === "number") {
      setParticleCount(value);
    } else if (key === "scale" && typeof value === "number") {
      setFieldScale(value);
    } else if (key === "speed" && typeof value === "number") {
      setSpeed(value);
    }
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
          onClick={() => setSeed(randomSeedString())}
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
      <div className="flex h-full flex-col sm:flex-row">
        <div className="relative min-h-0 flex-1">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-label="Animated canvas showing thousands of particles streaming through a Perlin noise flow field. Use the controls panel to adjust particle count, field scale, and speed."
            suppressHydrationWarning
            style={{ background: isLight ? LIGHT_BG : DARK_BG }}
          />
        </div>
        <div className="shrink-0 overflow-y-auto border-t border-border p-3 sm:border-t-0 sm:border-l">
          <KnobsPanel
            title="Field controls"
            knobs={[
              {
                kind: "number",
                key: "particles",
                label: "Particles",
                min: MIN_PARTICLE_COUNT,
                max: MAX_PARTICLE_COUNT,
                step: STEP_PARTICLE_COUNT,
                value: particleCount,
              },
              {
                kind: "number",
                key: "scale",
                label: "Field scale",
                min: MIN_FIELD_SCALE,
                max: MAX_FIELD_SCALE,
                step: STEP_FIELD_SCALE,
                value: fieldScale,
              },
              {
                kind: "number",
                key: "speed",
                label: "Speed",
                min: MIN_SPEED,
                max: MAX_SPEED,
                step: STEP_SPEED,
                value: speed,
              },
            ]}
            onChange={handleKnobChange}
          />
        </div>
      </div>
    </PlayShell>
  );
}
