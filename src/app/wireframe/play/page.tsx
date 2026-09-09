"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp } from "@/lib/creative";
import { clamp, lerp, map } from "@/lib/creative/math";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { makeMesh, rotate, project, SHAPES, type ShapeName, type Mesh } from "../geometry";

const DARK_BG = "#070a12";
const LIGHT_BG = "#f4f5f8";

type Tokens = { bg: string; theme: "light" | "dark" };

function resolveTokens(resolvedTheme: string | undefined): Tokens {
  const theme = resolvedTheme === "light" ? "light" : "dark";
  return { bg: theme === "light" ? LIGHT_BG : DARK_BG, theme };
}

export default function WireframePlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState<ShapeName>("icosahedron");
  const [speed, setSpeed] = useState<number>(1);
  // perspective: 0 = near-orthographic, 100 = strong perspective.
  const [perspective, setPerspective] = useState<number>(55);
  const { resolvedTheme } = useTheme();
  const tokens = resolveTokens(resolvedTheme);

  // Mutable state read by the render loop without re-creating the callback.
  const meshRef = useRef<Mesh>(makeMesh("icosahedron"));
  const rotRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.6 });
  const speedRef = useRef<number>(speed);
  const camRef = useRef<number>(0);
  const tokensRef = useRef<Tokens>(tokens);
  const draggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    meshRef.current = makeMesh(shape);
  }, [shape]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    camRef.current = map(perspective, 0, 100, 6.5, 1.9);
  }, [perspective]);
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const { bg, theme } = tokensRef.current;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const mesh = meshRef.current;
    const cam = camRef.current || 3;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.34;
    const { x: rx, y: ry } = rotRef.current;

    const pts = mesh.vertices.map((v) => {
      const r = rotate(v, rx, ry, 0);
      const p = project(r, cam);
      return { sx: cx + p.x * scale, sy: cy - p.y * scale, depth: r.z, fov: p.scale };
    });

    let minD = Infinity;
    let maxD = -Infinity;
    for (const p of pts) {
      if (p.depth < minD) minD = p.depth;
      if (p.depth > maxD) maxD = p.depth;
    }
    const depthT = (d: number) => (maxD === minD ? 0.5 : map(d, minD, maxD, 0, 1));

    // Painter's order: draw far edges first so near ones sit on top.
    const ordered = mesh.edges
      .map((e) => {
        const a = pts[e[0]];
        const b = pts[e[1]];
        const avg = a && b ? (a.depth + b.depth) / 2 : 0;
        return { a, b, avg };
      })
      .sort((p, q) => p.avg - q.avg);

    ctx.lineCap = "round";
    for (const { a, b, avg } of ordered) {
      if (!a || !b) continue;
      const t = depthT(avg);
      ctx.strokeStyle = cbRamp(t, theme);
      ctx.globalAlpha = lerp(0.45, 1, t);
      ctx.lineWidth = lerp(0.8, 2.8, t);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    for (const p of pts) {
      const t = depthT(p.depth);
      ctx.fillStyle = cbRamp(clamp(t + 0.15, 0, 1), theme);
      ctx.globalAlpha = lerp(0.5, 1, t);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, lerp(1.3, 3.6, t), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, []);

  // Fit the canvas to its box, DPR-aware, and redraw on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      drawScene();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [drawScene]);

  // Redraw when a static control changes while paused.
  useEffect(() => {
    drawScene();
  }, [shape, perspective, tokens.bg, drawScene]);

  useAnimationFrame(
    useCallback(
      ({ dt }: FrameInfo) => {
        if (!draggingRef.current) {
          const s = speedRef.current;
          rotRef.current.x += dt * s * 0.28;
          rotRef.current.y += dt * s * 0.52;
        }
        drawScene();
      },
      [drawScene],
    ),
    { pauseWhenHidden: true },
  );

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const last = lastPointerRef.current;
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    rotRef.current.y += dx * 0.01;
    rotRef.current.x += dy * 0.01;
    drawScene();
  };
  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    lastPointerRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const selectClass =
    "text-sm rounded border border-border bg-background text-foreground/80 hover:text-foreground px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const labelClass = "text-xs text-foreground/70";
  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const shapeLabelId = "wf-shape-label";
  const speedLabelId = "wf-speed-label";
  const perspLabelId = "wf-persp-label";

  return (
    <PlayShell
      slug="wireframe"
      title="Wireframe"
      visualLabel="A rotating 3D wireframe solid drawn with perspective and depth shading. Drag to rotate it."
      controls={
        <>
          <div className="flex items-center gap-2">
            <label id={shapeLabelId} htmlFor="wf-shape" className={labelClass}>
              shape
            </label>
            <select
              id="wf-shape"
              value={shape}
              onChange={(e) => setShape(e.target.value as ShapeName)}
              className={selectClass}
              aria-labelledby={shapeLabelId}
            >
              {SHAPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span id={speedLabelId} className={labelClass}>
              speed
            </span>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={speedLabelId}
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={speed}
            />
          </div>
          <div className="flex items-center gap-2">
            <span id={perspLabelId} className={labelClass}>
              perspective
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={perspective}
              onChange={(e) => setPerspective(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={perspLabelId}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={perspective}
            />
          </div>
        </>
      }
      attribution={<>Technique: rotation matrices + perspective projection on Canvas 2D.</>}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        aria-label="A rotating 3D wireframe solid. Drag to rotate it, or use the controls to change shape, speed, and perspective."
        suppressHydrationWarning
        style={{ background: tokens.bg }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      />
    </PlayShell>
  );
}
