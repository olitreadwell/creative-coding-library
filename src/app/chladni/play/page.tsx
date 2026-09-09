"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { chladni, nodeIntensity } from "../chladni";

const RES = 200; // field is computed on a RES x RES buffer, then scaled up
const DRIFT = 0.12; // how far the modes wander from their integer targets
const NODE_WIDTH = 0.16; // thickness of the nodal lines in field units

const DARK_BG = "#06060e";
const LIGHT_BG = "#f5f4f0";

// Line and background colors as RGB, blended per pixel by node intensity.
const DARK_LINE = [120, 245, 220] as const;
const DARK_FILL = [8, 8, 16] as const;
const LIGHT_LINE = [24, 22, 34] as const;
const LIGHT_FILL = [245, 244, 240] as const;

const MODE_MIN = 1;
const MODE_MAX = 10;
const A_DEFAULT = 3;
const B_DEFAULT = 5;

type Buffer = { canvas: HTMLCanvasElement; image: ImageData };

function paintField(buf: Buffer, a: number, b: number, dark: boolean): void {
  const data = buf.image.data;
  const line = dark ? DARK_LINE : LIGHT_LINE;
  const fill = dark ? DARK_FILL : LIGHT_FILL;
  let i = 0;
  for (let py = 0; py < RES; py++) {
    const y = py / (RES - 1);
    for (let px = 0; px < RES; px++) {
      const x = px / (RES - 1);
      const t = nodeIntensity(chladni(x, y, a, b), NODE_WIDTH);
      data[i] = fill[0] + (line[0] - fill[0]) * t;
      data[i + 1] = fill[1] + (line[1] - fill[1]) * t;
      data[i + 2] = fill[2] + (line[2] - fill[2]) * t;
      data[i + 3] = 255;
      i += 4;
    }
  }
  const bctx = buf.canvas.getContext("2d");
  if (bctx) bctx.putImageData(buf.image, 0, 0);
}

export default function ChladniPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufRef = useRef<Buffer | null>(null);
  const timeRef = useRef<number>(0);

  const [a, setA] = useState<number>(A_DEFAULT);
  const [b, setB] = useState<number>(B_DEFAULT);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === undefined ? true : resolvedTheme !== "light";

  const aRef = useRef<number>(a);
  const bRef = useRef<number>(b);
  const isDarkRef = useRef<boolean>(isDark);
  useEffect(() => {
    aRef.current = a;
  }, [a]);
  useEffect(() => {
    bRef.current = b;
  }, [b]);
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const blit = useCallback(() => {
    const cv = canvasRef.current;
    const buf = bufRef.current;
    if (!cv || !buf) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.width / dpr;
    const h = cv.height / dpr;
    ctx.imageSmoothingEnabled = true;
    const side = Math.min(w, h);
    const ox = (w - side) / 2;
    const oy = (h - side) / 2;
    ctx.fillStyle = isDarkRef.current ? DARK_BG : LIGHT_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(buf.canvas, ox, oy, side, side);
  }, []);

  const renderStatic = useCallback(() => {
    const buf = bufRef.current;
    if (!buf) return;
    paintField(buf, aRef.current, bRef.current, isDarkRef.current);
    blit();
  }, [blit]);

  useEffect(() => {
    const off = document.createElement("canvas");
    off.width = RES;
    off.height = RES;
    const bctx = off.getContext("2d");
    if (!bctx) return;
    bufRef.current = { canvas: off, image: bctx.createImageData(RES, RES) };

    const cv = canvasRef.current;
    if (!cv) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderStatic();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [renderStatic]);

  useEffect(() => {
    renderStatic();
  }, [a, b, isDark, renderStatic]);

  useAnimationFrame(
    useCallback(
      ({ dt }: { dt: number }) => {
        timeRef.current += dt;
        const t = timeRef.current;
        const buf = bufRef.current;
        if (!buf) return;
        // Let the modes breathe slightly around their integer targets so the
        // nodal lines shimmer instead of sitting frozen.
        const da = aRef.current + DRIFT * Math.sin(t * 0.5);
        const db = bRef.current + DRIFT * Math.sin(t * 0.37 + 1);
        paintField(buf, da, db, isDarkRef.current);
        blit();
      },
      [blit],
    ),
    { pauseWhenHidden: true, reducedMotionFrames: 1 },
  );

  const bg = isDark ? DARK_BG : LIGHT_BG;
  const aLabelId = "chladni-a-label";
  const bLabelId = "chladni-b-label";

  return (
    <PlayShell
      slug="chladni"
      title="Chladni Figures — live sketch"
      visualLabel="Chladni figures. Two standing waves on a square plate combine into shifting nodal-line patterns."
      attribution={
        <>
          Technique: a superposition of two plate vibration modes, after{" "}
          <a
            href="https://en.wikipedia.org/wiki/Ernst_Chladni"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Ernst Chladni
          </a>
          .
        </>
      }
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={aLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              mode a
            </span>
            <input
              type="range"
              min={MODE_MIN}
              max={MODE_MAX}
              step={1}
              value={a}
              onChange={(e) => setA(Number(e.target.value))}
              className="w-28 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={aLabelId}
              aria-valuemin={MODE_MIN}
              aria-valuemax={MODE_MAX}
              aria-valuenow={a}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">{a}</span>
          </div>

          <div className="flex items-center gap-2">
            <span id={bLabelId} className="text-xs text-foreground/70 w-12 shrink-0">
              mode b
            </span>
            <input
              type="range"
              min={MODE_MIN}
              max={MODE_MAX}
              step={1}
              value={b}
              onChange={(e) => setB(Number(e.target.value))}
              className="w-28 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={bLabelId}
              aria-valuemin={MODE_MIN}
              aria-valuemax={MODE_MAX}
              aria-valuenow={b}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">{b}</span>
          </div>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Chladni figure animation. Nodal lines of two combined standing waves shift slowly."
        suppressHydrationWarning
        style={{ background: bg }}
      />
    </PlayShell>
  );
}
