"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { clamp } from "@/lib/creative/math";
import {
  type Season,
  SEASONS,
  SEASON_PALETTES,
  blendSeasonRibbons,
  blendBg,
  nextSeason,
  rgbaTuple,
  type RgbTuple,
} from "../season-blend";

const DEFAULT_RIBBON_COUNT = 7;
const MIN_RIBBONS = 3;
const MAX_RIBBONS = 14;

const DEFAULT_CYCLE_SPEED = 0.04;
const MIN_CYCLE_SPEED = 0.005;
const MAX_CYCLE_SPEED = 0.15;
const STEP_CYCLE_SPEED = 0.005;

const RIBBON_ALPHA_DARK = 0.55;
const RIBBON_ALPHA_LIGHT = 0.45;
const ACCENT_ALPHA_DARK = 0.7;
const ACCENT_ALPHA_LIGHT = 0.5;

type Accent = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
};

function makeAccents(count: number, width: number, height: number): Accent[] {
  const accents: Accent[] = [];
  for (let i = 0; i < count; i++) {
    accents.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      radius: 2 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return accents;
}

const btnClass =
  "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const sliderClass =
  "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const labelClass = "text-xs text-foreground/70";
const valueLabelClass = "w-12 text-right text-xs text-foreground/70 tabular-nums";

export default function SeasonsPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "dark") as "light" | "dark";
  const isLight = theme === "light";

  const [currentSeason, setCurrentSeason] = useState<Season>("spring");
  const [autoCycle, setAutoCycle] = useState(true);
  const [cycleSpeed, setCycleSpeed] = useState(DEFAULT_CYCLE_SPEED);
  const [ribbonCount, setRibbonCount] = useState(DEFAULT_RIBBON_COUNT);

  // Animation state held in refs so the loop always reads latest values.
  const fromSeasonRef = useRef<Season>("spring");
  const toSeasonRef = useRef<Season>("summer");
  const blendTRef = useRef(0);
  const autoCycleRef = useRef(autoCycle);
  const cycleSpeedRef = useRef(cycleSpeed);
  const ribbonCountRef = useRef(ribbonCount);
  const isLightRef = useRef(isLight);
  const accentsRef = useRef<Accent[]>([]);
  const sizeRef = useRef({ width: 800, height: 600 });

  useEffect(() => {
    autoCycleRef.current = autoCycle;
  }, [autoCycle]);
  useEffect(() => {
    cycleSpeedRef.current = cycleSpeed;
  }, [cycleSpeed]);
  useEffect(() => {
    ribbonCountRef.current = ribbonCount;
  }, [ribbonCount]);
  useEffect(() => {
    isLightRef.current = isLight;
  }, [isLight]);

  // When the user picks a season from the select, jump the blend state.
  const handleSeasonSelect = useCallback((season: Season) => {
    fromSeasonRef.current = season;
    toSeasonRef.current = nextSeason(season);
    blendTRef.current = 0;
    setCurrentSeason(season);
    setAutoCycle(false);
    autoCycleRef.current = false;
  }, []);

  // Canvas resize: DPR-aware, updates accent positions.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      const ctx = cv.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width: w, height: h };
      accentsRef.current = makeAccents(40, w, h);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame(
    useCallback(({ dt }: { dt: number }) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;

      const { width, height } = sizeRef.current;
      const light = isLightRef.current;
      const speed = cycleSpeedRef.current;
      const count = ribbonCountRef.current;

      // Advance the season blend when auto-cycling.
      if (autoCycleRef.current) {
        blendTRef.current = clamp(blendTRef.current + speed * dt, 0, 1);
        if (blendTRef.current >= 1) {
          fromSeasonRef.current = toSeasonRef.current;
          toSeasonRef.current = nextSeason(fromSeasonRef.current);
          blendTRef.current = 0;
          setCurrentSeason(fromSeasonRef.current);
        }
      }

      const t = blendTRef.current;
      const fromPalette = SEASON_PALETTES[fromSeasonRef.current];
      const toPalette = SEASON_PALETTES[toSeasonRef.current];

      const bgHex = light
        ? blendBg(fromPalette.bg, toPalette.bg, t)
        : blendBg(fromPalette.bgDark, toPalette.bgDark, t);

      const { ribbons: blendedRibbons, accent: blendedAccent } = blendSeasonRibbons(
        fromPalette,
        toPalette,
        t,
      );

      // Fill background.
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, width, height);

      const ribbonAlpha = light ? RIBBON_ALPHA_LIGHT : RIBBON_ALPHA_DARK;

      // Draw flowing ribbon curves.
      const now = performance.now() / 1000;
      for (let r = 0; r < count; r++) {
        const frac = r / (count - 1 || 1);
        const yBase = height * (0.1 + frac * 0.8);
        const amplitude = height * (0.04 + frac * 0.06);
        const freq = 1.5 + frac * 1.2;
        const phase = frac * Math.PI * 2.5;
        const drift = now * (0.15 + frac * 0.1);

        // Pick ribbon color from the blended palette, cycling by index.
        const paletteLen = blendedRibbons.length;
        const fallback: RgbTuple = [128, 128, 128];
        const colorA: RgbTuple = blendedRibbons[r % paletteLen] ?? fallback;
        const colorB: RgbTuple = blendedRibbons[(r + 1) % paletteLen] ?? fallback;

        ctx.beginPath();
        for (let px = 0; px <= width; px += 3) {
          const x = px;
          const normalizedX = px / width;
          const wave =
            Math.sin(normalizedX * Math.PI * freq + phase + drift) * amplitude +
            Math.sin(normalizedX * Math.PI * freq * 0.7 + phase * 1.3 + drift * 0.8) *
              amplitude *
              0.4;
          const y = yBase + wave;

          if (px === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Blend along the ribbon for a gradient feel using a gradient stroke.
        const grad = ctx.createLinearGradient(0, yBase, width, yBase);
        grad.addColorStop(0, rgbaTuple(colorA, ribbonAlpha));
        grad.addColorStop(0.5, rgbaTuple(colorB, ribbonAlpha * 0.8));
        grad.addColorStop(1, rgbaTuple(colorA, ribbonAlpha));

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + frac * 3;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }

      // Update and draw accent dots (petals / leaves / snow / sun-glints).
      const accentAlpha = light ? ACCENT_ALPHA_LIGHT : ACCENT_ALPHA_DARK;
      const accents = accentsRef.current;
      ctx.globalAlpha = accentAlpha;

      for (let i = 0; i < accents.length; i++) {
        const a = accents[i];
        if (!a) continue;

        a.x += a.vx;
        a.y += a.vy;
        a.phase += dt * 1.2;

        // Wrap accents that drift off screen.
        if (a.y < -10) a.y = height + 10;
        if (a.y > height + 10) a.y = -10;
        if (a.x < -10) a.x = width + 10;
        if (a.x > width + 10) a.x = -10;

        const wobble = Math.sin(a.phase) * 2;

        ctx.beginPath();
        ctx.arc(a.x + wobble, a.y, a.radius, 0, Math.PI * 2);
        ctx.fillStyle = rgbaTuple(blendedAccent, 1);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }, []),
    { pauseWhenHidden: true },
  );

  const seasonLabelId = "season-select-label";
  const cycleSpeedLabelId = "cycle-speed-label";
  const ribbonCountLabelId = "ribbon-count-label";

  const bgForCanvas = isLight
    ? (SEASON_PALETTES[currentSeason]?.bg ?? "#e8f4f0")
    : (SEASON_PALETTES[currentSeason]?.bgDark ?? "#071812");

  return (
    <PlayShell
      slug="seasons"
      title="Seasons"
      visualLabel="Animated canvas showing flowing ribbon curves whose colors cycle through the four seasons"
      controls={
        <>
          <div className="flex items-center gap-2">
            <label htmlFor="season-select" id={seasonLabelId} className={labelClass}>
              season
            </label>
            <select
              id="season-select"
              value={currentSeason}
              onChange={(e) => handleSeasonSelect(e.target.value as Season)}
              className="text-sm rounded border border-border bg-background text-foreground/70 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={seasonLabelId}
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setAutoCycle((v) => !v)}
            className={btnClass}
            aria-pressed={autoCycle}
            aria-label={autoCycle ? "Stop auto-cycling seasons" : "Start auto-cycling seasons"}
          >
            {autoCycle ? "Auto: on" : "Auto: off"}
          </button>

          <div className="flex items-center gap-2">
            <span id={cycleSpeedLabelId} className={labelClass}>
              speed
            </span>
            <input
              type="range"
              min={MIN_CYCLE_SPEED}
              max={MAX_CYCLE_SPEED}
              step={STEP_CYCLE_SPEED}
              value={cycleSpeed}
              onChange={(e) => setCycleSpeed(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={cycleSpeedLabelId}
              aria-valuemin={MIN_CYCLE_SPEED}
              aria-valuemax={MAX_CYCLE_SPEED}
              aria-valuenow={cycleSpeed}
            />
            <span className={valueLabelClass}>{cycleSpeed.toFixed(3)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span id={ribbonCountLabelId} className={labelClass}>
              ribbons
            </span>
            <input
              type="range"
              min={MIN_RIBBONS}
              max={MAX_RIBBONS}
              step={1}
              value={ribbonCount}
              onChange={(e) => setRibbonCount(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={ribbonCountLabelId}
              aria-valuemin={MIN_RIBBONS}
              aria-valuemax={MAX_RIBBONS}
              aria-valuenow={ribbonCount}
            />
            <span className={valueLabelClass}>{ribbonCount}</span>
          </div>
        </>
      }
      attribution={<>Original composition. Colorblind-safe palettes from the Okabe-Ito set.</>}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated canvas showing layered flowing ribbon curves. Colors shift gradually between the four seasons. Use the controls to choose a season or adjust the auto-cycle speed."
        suppressHydrationWarning
        style={{ background: bgForCanvas }}
      />
    </PlayShell>
  );
}
