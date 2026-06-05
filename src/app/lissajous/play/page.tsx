"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { samplePath, type LissajousParams } from "../curve";

const PHASE_SPEED = 0.18;
const BASE_HUE = 200;
const HUE_RANGE = 160;
const LINE_WIDTH = 1.2;
const GLOW_ALPHA = 0.55;

// Light theme: deep indigo/violet pen on cream-white paper
const DARK_BG = "#06060e";
const LIGHT_BG = "#f5f4f0";
const LIGHT_BASE_HUE = 255; // deep indigo
const LIGHT_HUE_RANGE = 60; // indigo → violet
const LIGHT_LINE_ALPHA = 0.72;

// Control bounds
const FREQ_MIN = 1;
const FREQ_MAX = 10;
const FREQ_STEP = 0.5;
const STEPS_MIN = 200;
const STEPS_MAX = 4000;
const STEPS_DEFAULT = 2000;
const DECAY_MIN = 0;
const DECAY_MAX = 0.15;
const DECAY_DEFAULT = 0.04;
const DECAY_STEP = 0.005;
const TWO_PI = Math.PI * 2;

type Ratio = { a: number; b: number; label: string };

const RATIO_PRESETS: readonly Ratio[] = [
  { a: 3, b: 2, label: "3 : 2" },
  { a: 5, b: 4, label: "5 : 4" },
  { a: 3, b: 4, label: "3 : 4" },
  { a: 5, b: 6, label: "5 : 6" },
];

type DrawState = {
  width: number;
  height: number;
  phase: number;
  freqA: number;
  freqB: number;
  decay: number;
  steps: number;
  dark: boolean;
};

function drawCurve(ctx: CanvasRenderingContext2D, state: DrawState): void {
  const { width, height, phase, freqA, freqB, decay, steps, dark } = state;
  const hw = width / 2;
  const hh = height / 2;
  const radius = Math.min(hw, hh) * 0.85;

  const params: LissajousParams = {
    a: freqA,
    b: freqB,
    A: radius,
    B: radius,
    phase,
    decay,
  };

  const pts = samplePath(params, steps);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = dark ? DARK_BG : LIGHT_BG;
  ctx.fillRect(0, 0, width, height);

  if (dark) {
    ctx.globalCompositeOperation = "lighter";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.lineWidth = LINE_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    if (!prev || !curr) continue;

    const t = i / (pts.length - 1);

    let strokeStyle: string;
    if (dark) {
      const hue = map(t, 0, 1, BASE_HUE, BASE_HUE + HUE_RANGE);
      strokeStyle = hslString(hsl(hue, 0.9, 0.65), GLOW_ALPHA);
    } else {
      const hue = map(t, 0, 1, LIGHT_BASE_HUE, LIGHT_BASE_HUE + LIGHT_HUE_RANGE);
      // Dark saturated line: high saturation, low lightness for strong contrast on light bg
      strokeStyle = hslString(hsl(hue, 0.85, 0.28), LIGHT_LINE_ALPHA);
    }

    ctx.strokeStyle = strokeStyle;

    ctx.beginPath();
    ctx.moveTo(hw + prev.x, hh + prev.y);
    ctx.lineTo(hw + curr.x, hh + curr.y);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
}

export default function LissajousPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<number>(0);

  // Controls state — defaults match original constants so the default look is unchanged
  const defaultRatio = RATIO_PRESETS[0] ?? { a: 3, b: 2, label: "3 : 2" };
  const [ratio, setRatio] = useState<Ratio>(defaultRatio);
  const [freqA, setFreqA] = useState<number>(defaultRatio.a);
  const [freqB, setFreqB] = useState<number>(defaultRatio.b);
  const [phase, setPhase] = useState<number>(0);
  const [decay, setDecay] = useState<number>(DECAY_DEFAULT);
  const [steps, setSteps] = useState<number>(STEPS_DEFAULT);

  const { resolvedTheme } = useTheme();
  // Guard undefined (SSR / before hydration) with "dark" default
  const isDark = resolvedTheme === undefined ? true : resolvedTheme !== "light";

  // Keep refs in sync so animation callback always reads the latest values
  const freqARef = useRef<number>(freqA);
  const freqBRef = useRef<number>(freqB);
  const decayRef = useRef<number>(decay);
  const stepsRef = useRef<number>(steps);
  const isDarkRef = useRef<boolean>(isDark);
  useEffect(() => {
    freqARef.current = freqA;
  }, [freqA]);
  useEffect(() => {
    freqBRef.current = freqB;
  }, [freqB]);
  useEffect(() => {
    decayRef.current = decay;
  }, [decay]);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  // When a preset is selected, sync the A/B sliders to match
  function handlePreset(r: Ratio) {
    setRatio(r);
    setFreqA(r.a);
    setFreqB(r.b);
  }

  // When A or B slider is moved, clear the active preset label
  function handleFreqA(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setFreqA(val);
    setRatio((prev) => ({ ...prev, label: "" }));
  }

  function handleFreqB(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setFreqB(val);
    setRatio((prev) => ({ ...prev, label: "" }));
  }

  function handlePhase(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setPhase(val);
    phaseRef.current = val;
  }

  function handleDecay(e: React.ChangeEvent<HTMLInputElement>) {
    setDecay(Number(e.target.value));
  }

  function handleSteps(e: React.ChangeEvent<HTMLInputElement>) {
    setSteps(Number(e.target.value));
  }

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = cv.clientWidth;
      const cssH = cv.clientHeight;
      cv.width = cssW * dpr;
      cv.height = cssH * dpr;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      drawCurve(ctx, {
        width: cssW,
        height: cssH,
        phase: phaseRef.current,
        freqA: freqARef.current,
        freqB: freqBRef.current,
        decay: decayRef.current,
        steps: stepsRef.current,
        dark: isDarkRef.current,
      });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);

  // Redraw immediately when any reactive state changes
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    drawCurve(ctx, {
      width: cv.width / dpr,
      height: cv.height / dpr,
      phase: phaseRef.current,
      freqA,
      freqB,
      decay,
      steps,
      dark: isDark,
    });
  }, [isDark, freqA, freqB, decay, steps]);

  useAnimationFrame(
    useCallback(({ dt }: { dt: number }) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;

      phaseRef.current += PHASE_SPEED * dt;

      const dpr = window.devicePixelRatio || 1;
      drawCurve(ctx, {
        width: cv.width / dpr,
        height: cv.height / dpr,
        phase: phaseRef.current,
        freqA: freqARef.current,
        freqB: freqBRef.current,
        decay: decayRef.current,
        steps: stepsRef.current,
        dark: isDarkRef.current,
      });
    }, []),
    { pauseWhenHidden: true, reducedMotionFrames: 60 },
  );

  const bg = isDark ? DARK_BG : LIGHT_BG;

  const btnActive = "border-foreground/60 text-foreground bg-foreground/10";
  const btnInactive =
    "border-border text-foreground/70 hover:border-foreground/50 hover:text-foreground";
  const btnClass =
    "text-xs px-3 py-1 rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  // Label IDs for aria-labelledby
  const freqALabelId = "lissajous-freq-a-label";
  const freqBLabelId = "lissajous-freq-b-label";
  const phaseLabelId = "lissajous-phase-label";
  const decayLabelId = "lissajous-decay-label";
  const trailLabelId = "lissajous-trail-label";

  return (
    <PlayShell
      slug="lissajous"
      title="Lissajous — live sketch"
      visualLabel="Lissajous curve animation. Two sine waves combine to trace a morphing path."
      controls={
        <>
          {/* Preset buttons */}
          <div role="group" aria-label="Frequency ratio presets" className="flex flex-wrap gap-2">
            {RATIO_PRESETS.map((r) => {
              const isActive = ratio.label === r.label;
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => handlePreset(r)}
                  aria-pressed={isActive}
                  aria-label={`Frequency ratio ${r.label}`}
                  className={[btnClass, isActive ? btnActive : btnInactive].join(" ")}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Frequency A slider */}
          <div className="flex items-center gap-2">
            <span id={freqALabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              freq A
            </span>
            <input
              type="range"
              min={FREQ_MIN}
              max={FREQ_MAX}
              step={FREQ_STEP}
              value={freqA}
              onChange={handleFreqA}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={freqALabelId}
              aria-valuemin={FREQ_MIN}
              aria-valuemax={FREQ_MAX}
              aria-valuenow={freqA}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">{freqA}</span>
          </div>

          {/* Frequency B slider */}
          <div className="flex items-center gap-2">
            <span id={freqBLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              freq B
            </span>
            <input
              type="range"
              min={FREQ_MIN}
              max={FREQ_MAX}
              step={FREQ_STEP}
              value={freqB}
              onChange={handleFreqB}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={freqBLabelId}
              aria-valuemin={FREQ_MIN}
              aria-valuemax={FREQ_MAX}
              aria-valuenow={freqB}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">{freqB}</span>
          </div>

          {/* Phase slider */}
          <div className="flex items-center gap-2">
            <span id={phaseLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              phase
            </span>
            <input
              type="range"
              min={0}
              max={TWO_PI}
              step={0.05}
              value={phase}
              onChange={handlePhase}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={phaseLabelId}
              aria-valuemin={0}
              aria-valuemax={TWO_PI}
              aria-valuenow={phase}
            />
            <span className="w-10 text-right text-xs text-foreground/70 tabular-nums">
              {phase.toFixed(2)}
            </span>
          </div>

          {/* Decay slider */}
          <div className="flex items-center gap-2">
            <span id={decayLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              decay
            </span>
            <input
              type="range"
              min={DECAY_MIN}
              max={DECAY_MAX}
              step={DECAY_STEP}
              value={decay}
              onChange={handleDecay}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={decayLabelId}
              aria-valuemin={DECAY_MIN}
              aria-valuemax={DECAY_MAX}
              aria-valuenow={decay}
            />
            <span className="w-10 text-right text-xs text-foreground/70 tabular-nums">
              {decay.toFixed(3)}
            </span>
          </div>

          {/* Trail length / density slider */}
          <div className="flex items-center gap-2">
            <span id={trailLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              trail
            </span>
            <input
              type="range"
              min={STEPS_MIN}
              max={STEPS_MAX}
              step={100}
              value={steps}
              onChange={handleSteps}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={trailLabelId}
              aria-valuemin={STEPS_MIN}
              aria-valuemax={STEPS_MAX}
              aria-valuenow={steps}
            />
            <span className="w-10 text-right text-xs text-foreground/70 tabular-nums">{steps}</span>
          </div>
        </>
      }
      attribution={
        <>
          Technique: parametric sine curves (additive glow on dark, pen drawing on light). Named
          after{" "}
          <a
            href="https://en.wikipedia.org/wiki/Lissajous_curve"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Jules Antoine Lissajous
          </a>
          .
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Lissajous curve animation. Two sine waves combine to trace a morphing path."
        suppressHydrationWarning
        style={{ background: bg }}
      />
    </PlayShell>
  );
}
