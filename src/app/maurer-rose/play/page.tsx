"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { maurerVertices, rosePetals } from "../rose";

const SPIN_SPEED = 0.06; // radians per second
const PETAL_STEPS = 720;

const DARK_BG = "#06060e";
const LIGHT_BG = "#f5f4f0";

const N_MIN = 1;
const N_MAX = 12;
const D_MIN = 1;
const D_MAX = 180;
const N_DEFAULT = 6;
const D_DEFAULT = 71;

type DrawState = {
  width: number;
  height: number;
  n: number;
  d: number;
  spin: number;
  dark: boolean;
};

function draw(ctx: CanvasRenderingContext2D, state: DrawState): void {
  const { width, height, n, d, spin, dark } = state;
  const hw = width / 2;
  const hh = height / 2;
  const radius = Math.min(hw, hh) * 0.92;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = dark ? DARK_BG : LIGHT_BG;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(hw, hh);
  ctx.rotate(spin);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Faint backdrop: the smooth rose the chords are sampled from.
  const petals = rosePetals(n, radius, PETAL_STEPS);
  ctx.globalCompositeOperation = "source-over";
  ctx.lineWidth = dark ? 1.4 : 1.2;
  ctx.strokeStyle = dark ? hslString(hsl(320, 0.6, 0.5), 0.25) : hslString(hsl(320, 0.7, 0.4), 0.3);
  ctx.beginPath();
  for (let i = 0; i < petals.length; i++) {
    const p = petals[i];
    if (!p) continue;
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // The Maurer chords: 360 straight lines, hue shifting along the walk.
  const verts = maurerVertices(n, d, radius);
  ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
  ctx.lineWidth = dark ? 0.8 : 0.7;
  for (let i = 1; i < verts.length; i++) {
    const a = verts[i - 1];
    const b = verts[i];
    if (!a || !b) continue;
    const t = i / (verts.length - 1);
    const hue = map(t, 0, 1, 190, 320);
    ctx.strokeStyle = dark
      ? hslString(hsl(hue, 0.9, 0.62), 0.5)
      : hslString(hsl(hue, 0.85, 0.32), 0.55);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

export default function MaurerRosePlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinRef = useRef<number>(0);

  const [n, setN] = useState<number>(N_DEFAULT);
  const [d, setD] = useState<number>(D_DEFAULT);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === undefined ? true : resolvedTheme !== "light";

  const nRef = useRef<number>(n);
  const dRef = useRef<number>(d);
  const isDarkRef = useRef<boolean>(isDark);
  useEffect(() => {
    nRef.current = n;
  }, [n]);
  useEffect(() => {
    dRef.current = d;
  }, [d]);
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const render = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    draw(ctx, {
      width: cv.width / dpr,
      height: cv.height / dpr,
      n: nRef.current,
      d: dRef.current,
      spin: spinRef.current,
      dark: isDarkRef.current,
    });
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [render]);

  useEffect(() => {
    render();
  }, [n, d, isDark, render]);

  useAnimationFrame(
    useCallback(
      ({ dt }: { dt: number }) => {
        spinRef.current += SPIN_SPEED * dt;
        render();
      },
      [render],
    ),
    { pauseWhenHidden: true, reducedMotionFrames: 1 },
  );

  const bg = isDark ? DARK_BG : LIGHT_BG;
  const nLabelId = "maurer-n-label";
  const dLabelId = "maurer-d-label";

  return (
    <PlayShell
      slug="maurer-rose"
      title="Maurer Rose — live sketch"
      visualLabel="Maurer rose. Hundreds of straight chords across a polar rose curve form a woven web."
      attribution={
        <>
          Technique: a rose curve r = sin(n·θ) sampled every d degrees, vertices joined by chords.
          Named after{" "}
          <a
            href="https://en.wikipedia.org/wiki/Maurer_rose"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Peter Maurer
          </a>
          .
        </>
      }
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={nLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              petals n
            </span>
            <input
              type="range"
              min={N_MIN}
              max={N_MAX}
              step={1}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
              className="w-28 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={nLabelId}
              aria-valuemin={N_MIN}
              aria-valuemax={N_MAX}
              aria-valuenow={n}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">{n}</span>
          </div>

          <div className="flex items-center gap-2">
            <span id={dLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              step d°
            </span>
            <input
              type="range"
              min={D_MIN}
              max={D_MAX}
              step={1}
              value={d}
              onChange={(e) => setD(Number(e.target.value))}
              className="w-28 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={dLabelId}
              aria-valuemin={D_MIN}
              aria-valuemax={D_MAX}
              aria-valuenow={d}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">{d}</span>
          </div>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Maurer rose animation. Straight chords across a rose curve weave a slowly rotating web."
        suppressHydrationWarning
        style={{ background: bg }}
      />
    </PlayShell>
  );
}
