"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { clamp } from "@/lib/creative/math";
import { hslToRgb } from "@/lib/creative/color";
import { makeRng } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { type Agent, stepAgents, diffuseAndDecay, injectMask, trailIndex } from "../physarum";

// Simulation grid resolution. Fixed at ~260 px on the long side, independent
// of canvas display size. This keeps the per-frame work budget predictable.
const SIM_W = 260;
const SIM_H = 195;

const WORDS = ["wind", "water", "fire", "grass"] as const;
type Word = (typeof WORDS)[number];

// Per-word accent hues from the Okabe-Ito palette: colorblind-safe.
// wind = sky blue (56B4E9), water = blue (0072B2),
// fire = vermillion (D55E00), grass = bluish green (009E73).
const WORD_HUE: Record<Word, number> = {
  wind: 202,
  water: 202,
  fire: 19,
  grass: 164,
};

// Saturation/lightness per theme for the word accent.
const WORD_DARK_LIGHTNESS: Record<Word, number> = {
  wind: 0.68,
  water: 0.52,
  fire: 0.58,
  grass: 0.55,
};

const WORD_LIGHT_LIGHTNESS: Record<Word, number> = {
  wind: 0.38,
  water: 0.32,
  fire: 0.36,
  grass: 0.34,
};

// Seconds between automatic word transitions.
const AUTO_CYCLE_INTERVAL = 8;

// How long the fade/blend takes in steps.
const FADE_STEPS = 30;

// Agent count bounds.
const MIN_AGENTS = 1000;
const MAX_AGENTS = 6000;
const DEFAULT_AGENTS = 4000;

// Sense + turn angle bounds (in degrees, converted to radians internally).
const MIN_SENSE_DEG = 15;
const MAX_SENSE_DEG = 60;
const DEFAULT_SENSE_DEG = 35;

// Trail injection amount per step for mask cells.
const MASK_INJECT = 0.04;
const DECAY_RATE = 0.95;
const DEPOSIT = 0.08;
const SENSE_DIST = 5;
const STEP_SIZE = 1.2;

const LUT_SIZE = 256;

/** Build an RGBA LUT mapping trail intensity [0, 1] -> RGBA for the given word/theme. */
function buildLut(word: Word, theme: string | undefined): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(LUT_SIZE * 4);
  const dark = theme !== "light";
  const hue = WORD_HUE[word];
  const saturation = 0.78;

  for (let i = 0; i < LUT_SIZE; i++) {
    const t = i / (LUT_SIZE - 1);
    const lightness = dark
      ? clamp(0.06 + t * (WORD_DARK_LIGHTNESS[word] - 0.06), 0, 1)
      : clamp(0.96 - t * (0.96 - WORD_LIGHT_LIGHTNESS[word]), 0, 1);
    const rgb = hslToRgb({ h: hue, s: saturation, l: lightness });
    const pixIdx = i * 4;
    lut[pixIdx] = Math.round(clamp(rgb.r, 0, 1) * 255);
    lut[pixIdx + 1] = Math.round(clamp(rgb.g, 0, 1) * 255);
    lut[pixIdx + 2] = Math.round(clamp(rgb.b, 0, 1) * 255);
    lut[pixIdx + 3] = 255;
  }
  return lut;
}

/**
 * Renders `word` in bold into an offscreen canvas at SIM_W x SIM_H and
 * returns the pixel mask as Uint8ClampedArray (RGBA, SIM_W*SIM_H*4 bytes).
 */
function buildTextMask(word: string, w: number, h: number): Uint8ClampedArray {
  const oc = document.createElement("canvas");
  oc.width = w;
  oc.height = h;
  const ctx = oc.getContext("2d");
  if (!ctx) return new Uint8ClampedArray(w * h * 4);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Binary-search for a font size that fits within 85% of the grid width.
  let lo = 10;
  let hi = Math.min(w, h) * 1.5;
  for (let iter = 0; iter < 16; iter++) {
    const mid = (lo + hi) / 2;
    ctx.font = `900 ${mid}px sans-serif`;
    const mw = ctx.measureText(word).width;
    if (mw < w * 0.85) lo = mid;
    else hi = mid;
  }

  ctx.font = `900 ${lo}px sans-serif`;
  ctx.fillText(word, w / 2, h / 2);

  return ctx.getImageData(0, 0, w, h).data;
}

/** Spawn `count` agents seeded inside the text mask. Fallback to uniform random. */
function spawnAgents(
  count: number,
  mask: Uint8ClampedArray,
  w: number,
  h: number,
  seed: number,
): Agent[] {
  const rng = makeRng(seed);
  const masked: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if ((mask[i * 4 + 3] ?? 0) > 128) masked.push(i);
  }

  const agents: Agent[] = [];
  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    if (masked.length > 0) {
      const idx = masked[Math.floor(rng() * masked.length)] ?? 0;
      x = (idx % w) + (rng() - 0.5) * 2;
      y = Math.floor(idx / w) + (rng() - 0.5) * 2;
    } else {
      x = rng() * w;
      y = rng() * h;
    }
    agents.push({ x, y, heading: rng() * Math.PI * 2 });
  }
  return agents;
}

/** Write trail map into an ImageData buffer using a precomputed LUT. */
function paintTrail(
  imageData: ImageData,
  trail: Float32Array,
  w: number,
  h: number,
  lut: Uint8ClampedArray,
): void {
  const { data } = imageData;
  for (let i = 0; i < w * h; i++) {
    const v = clamp(trail[i] ?? 0, 0, 1);
    const li = Math.round(v * (LUT_SIZE - 1)) * 4;
    const pi = i * 4;
    data[pi] = lut[li] ?? 0;
    data[pi + 1] = lut[li + 1] ?? 0;
    data[pi + 2] = lut[li + 2] ?? 0;
    data[pi + 3] = 255;
  }
}

const btnClass =
  "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function PhysarumPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [wordIndex, setWordIndex] = useState<number>(0);
  const [autoCycle, setAutoCycle] = useState<boolean>(true);
  const [agentCount, setAgentCount] = useState<number>(DEFAULT_AGENTS);
  const [senseDeg, setSenseDeg] = useState<number>(DEFAULT_SENSE_DEG);

  const currentWord = WORDS[wordIndex] ?? "wind";

  // Sim state lives in refs so the animation loop always has fresh values.
  const trailRef = useRef<Float32Array>(new Float32Array(SIM_W * SIM_H));
  const tempRef = useRef<Float32Array>(new Float32Array(SIM_W * SIM_H));
  const agentsRef = useRef<Agent[]>([]);
  const maskRef = useRef<Uint8ClampedArray>(new Uint8ClampedArray(SIM_W * SIM_H * 4));
  const lutRef = useRef<Uint8ClampedArray>(new Uint8ClampedArray(LUT_SIZE * 4));

  const wordIndexRef = useRef<number>(0);
  const agentCountRef = useRef<number>(DEFAULT_AGENTS);
  const senseDegRef = useRef<number>(DEFAULT_SENSE_DEG);
  const autoCycleRef = useRef<boolean>(true);

  const { resolvedTheme } = useTheme();
  const themeRef = useRef<string | undefined>(resolvedTheme);

  // Tracks wall-clock seconds for auto-cycle timing.
  const autoTimerRef = useRef<number>(0);
  // Steps taken since the last word change (for fade logic).
  const fadeStepsRef = useRef<number>(FADE_STEPS + 1);

  // Keep theme ref current so the animation loop gets the latest value.
  useEffect(() => {
    themeRef.current = resolvedTheme;
    // Rebuild LUT when theme changes.
    const word = WORDS[wordIndexRef.current] ?? "wind";
    lutRef.current = buildLut(word, resolvedTheme);
  }, [resolvedTheme]);

  // Keep control refs current.
  useEffect(() => {
    wordIndexRef.current = wordIndex;
    const word = WORDS[wordIndex] ?? "wind";
    lutRef.current = buildLut(word, themeRef.current);
  }, [wordIndex]);

  useEffect(() => {
    agentCountRef.current = agentCount;
  }, [agentCount]);

  useEffect(() => {
    senseDegRef.current = senseDeg;
  }, [senseDeg]);

  useEffect(() => {
    autoCycleRef.current = autoCycle;
  }, [autoCycle]);

  // Initialize simulation: build offscreen canvas, first mask, agents, LUT.
  useEffect(() => {
    const oc = document.createElement("canvas");
    oc.width = SIM_W;
    oc.height = SIM_H;
    const ctx = oc.getContext("2d");
    if (!ctx) return;
    offscreenRef.current = oc;
    offscreenCtxRef.current = ctx;

    const word = WORDS[0] ?? "wind";
    const mask = buildTextMask(word, SIM_W, SIM_H);
    maskRef.current = mask;
    trailRef.current = new Float32Array(SIM_W * SIM_H);
    tempRef.current = new Float32Array(SIM_W * SIM_H);
    agentsRef.current = spawnAgents(DEFAULT_AGENTS, mask, SIM_W, SIM_H, Date.now());
    lutRef.current = buildLut(word, themeRef.current);

    // Pre-seed trail inside the mask so the slime starts on the letters.
    injectMask(trailRef.current, mask, SIM_W, SIM_H, 0.5);
    fadeStepsRef.current = FADE_STEPS + 1;
  }, []);

  // DPR-aware resize observer.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const dpr = window.devicePixelRatio ?? 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Transition to a new word: rebuild mask, re-seed agents, keep trail but fade it.
  const switchWord = useCallback((nextIdx: number) => {
    const word = WORDS[nextIdx] ?? "wind";
    const mask = buildTextMask(word, SIM_W, SIM_H);
    maskRef.current = mask;

    // Fade existing trail.
    const trail = trailRef.current;
    for (let i = 0; i < trail.length; i++) {
      trail[i] = (trail[i] ?? 0) * 0.25;
    }

    agentsRef.current = spawnAgents(agentCountRef.current, mask, SIM_W, SIM_H, Date.now());
    injectMask(trail, mask, SIM_W, SIM_H, 0.4);
    fadeStepsRef.current = 0;

    // Rebuild LUT for new word.
    lutRef.current = buildLut(word, themeRef.current);
    setWordIndex(nextIdx);
    wordIndexRef.current = nextIdx;
    autoTimerRef.current = 0;
  }, []);

  // Animation loop.
  useAnimationFrame(
    ({ dt }) => {
      const oc = offscreenRef.current;
      const octx = offscreenCtxRef.current;
      const canvas = canvasRef.current;
      if (!oc || !octx || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const trail = trailRef.current;
      const temp = tempRef.current;
      const mask = maskRef.current;
      const agents = agentsRef.current;
      const senseRad = (senseDegRef.current * Math.PI) / 180;
      const turnRad = senseRad * 0.5;

      // Trim or grow the agent pool if agentCount changed.
      if (agents.length !== agentCountRef.current) {
        const target = agentCountRef.current;
        if (agents.length > target) {
          agents.splice(target);
        } else {
          const rng = makeRng(Date.now());
          while (agents.length < target) {
            agents.push({
              x: rng() * SIM_W,
              y: rng() * SIM_H,
              heading: rng() * Math.PI * 2,
            });
          }
        }
      }

      // Inject trail from the text mask every step.
      injectMask(trail, mask, SIM_W, SIM_H, MASK_INJECT);

      // Advance agents.
      stepAgents(agents, trail, SIM_W, SIM_H, senseRad, SENSE_DIST, turnRad, STEP_SIZE, DEPOSIT);

      // Diffuse + decay.
      diffuseAndDecay(trail, temp, SIM_W, SIM_H, DECAY_RATE);

      // Paint.
      const imageData = octx.createImageData(SIM_W, SIM_H);
      paintTrail(imageData, trail, SIM_W, SIM_H, lutRef.current);
      octx.putImageData(imageData, 0, 0);

      const dpr = window.devicePixelRatio ?? 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.drawImage(oc, 0, 0, cssW, cssH);
      ctx.restore();

      // Auto-cycle logic.
      if (autoCycleRef.current) {
        autoTimerRef.current += dt;
        if (autoTimerRef.current >= AUTO_CYCLE_INTERVAL) {
          const nextIdx = (wordIndexRef.current + 1) % WORDS.length;
          switchWord(nextIdx);
        }
      }
    },
    { pauseWhenHidden: true, reducedMotionFrames: 200 },
  );

  const handleWordChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = Number(e.target.value);
      switchWord(idx);
    },
    [switchWord],
  );

  const handleAutoCycleToggle = useCallback(() => {
    setAutoCycle((prev) => {
      autoCycleRef.current = !prev;
      return !prev;
    });
  }, []);

  const handleAgentCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setAgentCount(v);
    agentCountRef.current = v;
  }, []);

  const handleSenseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setSenseDeg(v);
    senseDegRef.current = v;
  }, []);

  const wordSelectId = "physarum-word-select";
  const agentLabelId = "physarum-agent-label";
  const senseLabelId = "physarum-sense-label";

  const dark = resolvedTheme !== "light";
  const background = dark ? "#0a0a0a" : "#fafafa";

  return (
    <PlayShell
      slug="physarum"
      title="Physarum Letters"
      visualLabel={`Physarum slime-mold simulation spelling the word ${currentWord}. Trails grow and diffuse in real time.`}
      attribution={
        <>
          Physarum simulation. Concept from{" "}
          <a
            href="https://cargocollective.com/sagejenson/physarum"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Sage Jenson
          </a>{" "}
          and Jeff Jones (2010). MIT license.
        </>
      }
      controls={
        <>
          {/* Word select */}
          <div className="flex items-center gap-2">
            <label htmlFor={wordSelectId} className="text-xs text-foreground/70">
              word
            </label>
            <select
              id={wordSelectId}
              value={wordIndex}
              onChange={handleWordChange}
              className="text-sm rounded border border-border bg-background text-foreground/70 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {WORDS.map((w, i) => (
                <option key={w} value={i}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-cycle toggle */}
          <button
            type="button"
            onClick={handleAutoCycleToggle}
            aria-pressed={autoCycle}
            className={btnClass}
          >
            {autoCycle ? "auto: on" : "auto: off"}
          </button>

          {/* Agent count slider */}
          <div className="flex items-center gap-2">
            <span id={agentLabelId} className="text-xs text-foreground/70">
              agents
            </span>
            <input
              type="range"
              min={MIN_AGENTS}
              max={MAX_AGENTS}
              step={100}
              value={agentCount}
              onChange={handleAgentCountChange}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={agentLabelId}
              aria-valuemin={MIN_AGENTS}
              aria-valuemax={MAX_AGENTS}
              aria-valuenow={agentCount}
            />
            <span className="w-10 text-right text-xs text-foreground/70 tabular-nums">
              {agentCount}
            </span>
          </div>

          {/* Sense angle slider */}
          <div className="flex items-center gap-2">
            <span id={senseLabelId} className="text-xs text-foreground/70">
              sense
            </span>
            <input
              type="range"
              min={MIN_SENSE_DEG}
              max={MAX_SENSE_DEG}
              value={senseDeg}
              onChange={handleSenseChange}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={senseLabelId}
              aria-valuemin={MIN_SENSE_DEG}
              aria-valuemax={MAX_SENSE_DEG}
              aria-valuenow={senseDeg}
            />
            <span className="w-7 text-right text-xs text-foreground/70 tabular-nums">
              {senseDeg}°
            </span>
          </div>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        suppressHydrationWarning
        style={{ background, imageRendering: "pixelated" }}
        aria-label={`Physarum slime-mold trails spelling "${currentWord}". The simulation cycles through wind, water, fire, and grass.`}
      />
    </PlayShell>
  );
}
