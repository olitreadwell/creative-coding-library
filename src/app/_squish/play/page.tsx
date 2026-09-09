"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import {
  makePoint,
  verletStep,
  polygonArea,
  solveDistanceConstraint,
  applyPressure,
  collideWithBounds,
  type Blob,
  type Point,
} from "../softbody";

const DARK_BG = "#0d0d14";
const LIGHT_BG = "#f0f0f4";

const TAU = Math.PI * 2;

function makeBlobAt(
  cx: number,
  cy: number,
  radius: number,
  numPoints: number,
  color: string,
): Blob {
  const points: Point[] = [];
  const restLengths: number[] = [];
  const chordLen = 2 * radius * Math.sin(Math.PI / numPoints);

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * TAU - Math.PI / 2;
    points.push(makePoint(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)));
  }

  for (let i = 0; i < numPoints; i++) {
    restLengths.push(chordLen);
  }

  const restArea = polygonArea(points);

  return { points, restLengths, restArea, color };
}

type SimState = {
  blobs: Blob[];
  width: number;
  height: number;
  grabBlobIdx: number | null;
  grabPointIdx: number | null;
};

type SimParams = {
  gravity: number;
  stiffness: number;
  pressure: number;
  damping: number;
  blobCount: number;
};

const DEFAULT_PARAMS: SimParams = {
  gravity: 400,
  stiffness: 0.25,
  pressure: 0.00015,
  damping: 0.985,
  blobCount: 4,
};

const SOLVER_ITERATIONS = 4;
const POINT_COUNT = 16;
const FLOOR_MARGIN = 2;

function buildBlobs(width: number, height: number, count: number, theme: "light" | "dark"): Blob[] {
  const blobs: Blob[] = [];
  const radius = Math.min(width, height) * 0.1;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const cx = width * 0.1 + t * width * 0.8;
    const cy = height * 0.25 + (i % 2) * height * 0.15;
    const color = cbColor(i, theme);
    blobs.push(makeBlobAt(cx, cy, radius, POINT_COUNT, color));
  }

  return blobs;
}

function stepSim(sim: SimState, params: SimParams, dt: number, grabX: number, grabY: number): void {
  const clampedDt = Math.min(dt, 1 / 30);
  const floorY = sim.height - FLOOR_MARGIN;
  const leftX = FLOOR_MARGIN;
  const rightX = sim.width - FLOOR_MARGIN;

  for (let bi = 0; bi < sim.blobs.length; bi++) {
    const blob = sim.blobs[bi];
    if (!blob) continue;

    for (let pi = 0; pi < blob.points.length; pi++) {
      const p = blob.points[pi];
      if (!p) continue;

      if (bi === sim.grabBlobIdx && pi === sim.grabPointIdx) {
        blob.points[pi] = { x: grabX, y: grabY, px: grabX, py: grabY };
      } else {
        blob.points[pi] = verletStep(p, clampedDt, params.gravity, params.damping);
      }
    }

    for (let iter = 0; iter < SOLVER_ITERATIONS; iter++) {
      const n = blob.points.length;
      for (let i = 0; i < n; i++) {
        const a = blob.points[i];
        const b = blob.points[(i + 1) % n];
        const restLen = blob.restLengths[i];
        if (!a || !b || restLen === undefined) continue;
        solveDistanceConstraint(a, b, restLen, params.stiffness);
      }
      applyPressure(blob, params.pressure);

      if (bi === sim.grabBlobIdx && sim.grabPointIdx !== null) {
        const gp = blob.points[sim.grabPointIdx];
        if (gp) {
          blob.points[sim.grabPointIdx] = { x: grabX, y: grabY, px: grabX, py: grabY };
        }
      }
    }

    collideWithBounds(blob.points, leftX, rightX, floorY, 0.35);
  }
}

function drawBlob(ctx: CanvasRenderingContext2D, blob: Blob, isLight: boolean): void {
  const pts = blob.points;
  const n = pts.length;
  if (n < 3) return;

  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    if (!curr || !next) continue;
    const mx = (curr.x + next.x) * 0.5;
    const my = (curr.y + next.y) * 0.5;
    if (i === 0) {
      ctx.moveTo(mx, my);
    } else {
      ctx.quadraticCurveTo(curr.x, curr.y, mx, my);
    }
  }
  ctx.closePath();

  ctx.fillStyle = blob.color;
  ctx.globalAlpha = isLight ? 0.82 : 0.88;
  ctx.fill();

  ctx.strokeStyle = isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 1;
  ctx.stroke();

  if (n > 0) {
    const cx = pts.reduce((s, p) => s + p.x, 0) / n;
    const cy = pts.reduce((s, p) => s + p.y, 0) / n;
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
      ctx.globalAlpha = 1;
      return;
    }
    const grad = ctx.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, 30);
    grad.addColorStop(0, isLight ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 8, 22, 0, TAU);
    ctx.fillStyle = grad;
    ctx.globalAlpha = 1;
    ctx.fill();
  }
}

export default function SquishPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimState | null>(null);
  const paramsRef = useRef<SimParams>(DEFAULT_PARAMS);
  const grabRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "dark") as "light" | "dark";
  const themeRef = useRef(theme);
  const isLight = theme === "light";

  const [blobCount, setBlobCount] = useState(DEFAULT_PARAMS.blobCount);
  const [gravity, setGravity] = useState(DEFAULT_PARAMS.gravity);
  const [squishiness, setSquishiness] = useState(0.5);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    paramsRef.current = {
      ...paramsRef.current,
      gravity,
    };
  }, [gravity]);

  useEffect(() => {
    const stiffness = 0.05 + squishiness * 0.45;
    const pressure = 0.00005 + squishiness * 0.0003;
    paramsRef.current = {
      ...paramsRef.current,
      stiffness,
      pressure,
    };
  }, [squishiness]);

  const initSim = useCallback(
    (width: number, height: number, count: number, th: "light" | "dark") => {
      const blobs = buildBlobs(width, height, count, th);
      simRef.current = {
        blobs,
        width,
        height,
        grabBlobIdx: null,
        grabPointIdx: null,
      };
    },
    [],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      const ctx = cv.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initSim(w, h, paramsRef.current.blobCount, themeRef.current);
    };

    fit();
    const ro = new ResizeObserver(() => {
      fit();
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, [initSim]);

  useEffect(() => {
    if (!simRef.current) return;
    const { width, height } = simRef.current;
    simRef.current.blobs = buildBlobs(width, height, blobCount, themeRef.current);
    simRef.current.grabBlobIdx = null;
    simRef.current.grabPointIdx = null;
    paramsRef.current = { ...paramsRef.current, blobCount };
  }, [blobCount]);

  function canvasPt(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const cv = canvasRef.current;
    if (!cv) return { x: 0, y: 0 };
    const rect = cv.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function nearestPoint(sim: SimState, x: number, y: number): { bi: number; pi: number } | null {
    let best = Infinity;
    let bi = -1;
    let pi = -1;
    for (let b = 0; b < sim.blobs.length; b++) {
      const blob = sim.blobs[b];
      if (!blob) continue;
      for (let p = 0; p < blob.points.length; p++) {
        const pt = blob.points[p];
        if (!pt) continue;
        const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
        if (d < best) {
          best = d;
          bi = b;
          pi = p;
        }
      }
    }
    if (bi === -1) return null;
    return { bi, pi };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const sim = simRef.current;
    if (!sim) return;
    const { x, y } = canvasPt(e);
    grabRef.current = { x, y };
    const hit = nearestPoint(sim, x, y);
    if (!hit) return;
    sim.grabBlobIdx = hit.bi;
    sim.grabPointIdx = hit.pi;
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = canvasPt(e);
    grabRef.current = { x, y };
  }

  function handlePointerUp() {
    const sim = simRef.current;
    if (!sim) return;
    sim.grabBlobIdx = null;
    sim.grabPointIdx = null;
  }

  useAnimationFrame(
    useCallback(({ dt }) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const sim = simRef.current;
      if (!sim) return;

      const { x: gx, y: gy } = grabRef.current;
      stepSim(sim, paramsRef.current, dt, gx, gy);

      const light = themeRef.current === "light";
      ctx.clearRect(0, 0, sim.width, sim.height);
      ctx.fillStyle = light ? LIGHT_BG : DARK_BG;
      ctx.fillRect(0, 0, sim.width, sim.height);

      for (const blob of sim.blobs) {
        drawBlob(ctx, blob, light);
      }
    }, []),
    { pauseWhenHidden: true },
  );

  function handleReset() {
    const cv = canvasRef.current;
    if (!cv) return;
    initSim(cv.clientWidth, cv.clientHeight, paramsRef.current.blobCount, themeRef.current);
  }

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const sliderClass =
    "w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const labelClass = "text-xs text-foreground/70";
  const valueLabelClass = "w-10 text-right text-xs text-foreground/70 tabular-nums";

  const blobCountLabelId = "blob-count-label";
  const gravityLabelId = "gravity-label";
  const squishLabelId = "squish-label";

  return (
    <PlayShell
      slug="squish"
      title="Squish"
      visualLabel="Squishy soft-body blobs you can grab and fling around the canvas"
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={blobCountLabelId} className={labelClass}>
              blobs
            </span>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={blobCount}
              onChange={(e) => setBlobCount(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={blobCountLabelId}
              aria-valuemin={1}
              aria-valuemax={8}
              aria-valuenow={blobCount}
            />
            <span className={valueLabelClass}>{blobCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <span id={gravityLabelId} className={labelClass}>
              gravity
            </span>
            <input
              type="range"
              min={0}
              max={800}
              step={20}
              value={gravity}
              onChange={(e) => setGravity(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={gravityLabelId}
              aria-valuemin={0}
              aria-valuemax={800}
              aria-valuenow={gravity}
            />
            <span className={valueLabelClass}>{(gravity / 400).toFixed(1)}x</span>
          </div>

          <div className="flex items-center gap-2">
            <span id={squishLabelId} className={labelClass}>
              squish
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={squishiness}
              onChange={(e) => setSquishiness(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={squishLabelId}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={squishiness}
            />
            <span className={valueLabelClass}>{squishiness.toFixed(2)}</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className={btnClass}
            aria-label="Reset the simulation with fresh blobs"
          >
            Reset
          </button>
        </>
      }
      attribution={
        <>
          Technique: Verlet integration, distance constraints, and pressure force on Canvas 2D.
          Based on soft-body techniques from{" "}
          <a
            href="https://natureofcode.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            The Nature of Code
          </a>{" "}
          by Daniel Shiffman.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Interactive canvas: grab any blob with the pointer and fling it around. The blobs stretch, wobble, and fall under gravity."
        suppressHydrationWarning
        style={{ background: isLight ? LIGHT_BG : DARK_BG }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </PlayShell>
  );
}
