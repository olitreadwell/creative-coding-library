"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp, clamp } from "@/lib/creative";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { brightnessToIndex } from "../brightnessToIndex";

// ---------------------------------------------------------------------------
// Glyph sets
// ---------------------------------------------------------------------------

const GLYPH_SETS = {
  ascii: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
  dots: " ·•●",
} as const;

type GlyphSetKey = keyof typeof GLYPH_SETS;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CELL_SIZE = 10;
const MIN_CELL_SIZE = 6;
const MAX_CELL_SIZE = 28;

const DEFAULT_CONTRAST = 1.0;
const MIN_CONTRAST = 0.5;
const MAX_CONTRAST = 2.0;
const STEP_CONTRAST = 0.05;

const GLYPH_CANVAS_SIZE = 16;
const PROMPT_TEXT = 'Click "Enable camera" to start';

// ---------------------------------------------------------------------------
// Luminance (BT.601)
// ---------------------------------------------------------------------------

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// ---------------------------------------------------------------------------
// Measure ink density of a glyph by drawing it to a tiny offscreen canvas
// and counting non-transparent pixels.
// ---------------------------------------------------------------------------

function measureGlyphDensity(glyph: string, fontSize: number): number {
  const canvas = document.createElement("canvas");
  canvas.width = GLYPH_CANVAS_SIZE;
  canvas.height = GLYPH_CANVAS_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;

  ctx.clearRect(0, 0, GLYPH_CANVAS_SIZE, GLYPH_CANVAS_SIZE);
  ctx.fillStyle = "#000000";
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, GLYPH_CANVAS_SIZE / 2, GLYPH_CANVAS_SIZE / 2);

  const data = ctx.getImageData(0, 0, GLYPH_CANVAS_SIZE, GLYPH_CANVAS_SIZE).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) {
    if ((data[i] ?? 0) > 16) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Build sorted glyph array: measure density for each char in the set, then
// sort ascending by density so index 0 = least ink (space/blank), last = most.
// ---------------------------------------------------------------------------

type SortedGlyphs = { chars: string[]; densities: number[] };

function buildSortedGlyphs(setKey: GlyphSetKey, fontSize: number): SortedGlyphs {
  const raw = GLYPH_SETS[setKey];
  const entries: Array<{ char: string; density: number }> = [];
  for (const char of raw) {
    const density = measureGlyphDensity(char, fontSize);
    entries.push({ char, density });
  }
  entries.sort((a, b) => a.density - b.density);

  const deduped: Array<{ char: string; density: number }> = [];
  for (const e of entries) {
    const last = deduped[deduped.length - 1];
    if (!last || last.density !== e.density) {
      deduped.push(e);
    } else {
      // Keep the one already inserted; skip duplicate density.
    }
  }

  return {
    chars: deduped.map((e) => e.char),
    densities: deduped.map((e) => e.density),
  };
}

// ---------------------------------------------------------------------------
// Offscreen sample canvas
// ---------------------------------------------------------------------------

type SampleCtx = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
};

function makeSampleCtx(cols: number, rows: number): SampleCtx | null {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  return { canvas, ctx, cols, rows };
}

// ---------------------------------------------------------------------------
// Draw: prompt
// ---------------------------------------------------------------------------

function drawPrompt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: "dark" | "light",
): void {
  ctx.fillStyle = theme === "dark" ? "#0a0a0a" : "#f5f5f5";
  ctx.fillRect(0, 0, w, h);
  const fontSize = Math.round(clamp(Math.min(w, h) * 0.035, 11, 18));
  ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme === "dark" ? "rgba(237,237,237,0.55)" : "rgba(10,10,10,0.55)";
  ctx.fillText(PROMPT_TEXT, w / 2, h / 2);
}

// ---------------------------------------------------------------------------
// Draw: ASCII grid from video
// ---------------------------------------------------------------------------

function drawAscii(
  ctx: CanvasRenderingContext2D,
  sample: SampleCtx,
  video: HTMLVideoElement,
  sortedGlyphs: SortedGlyphs,
  cssW: number,
  cssH: number,
  cellSize: number,
  contrast: number,
  theme: "dark" | "light",
): void {
  const { cols, rows } = sample;

  sample.ctx.save();
  sample.ctx.translate(cols, 0);
  sample.ctx.scale(-1, 1);
  sample.ctx.drawImage(video, 0, 0, cols, rows);
  sample.ctx.restore();

  const pixels = sample.ctx.getImageData(0, 0, cols, rows);
  const data = pixels.data;

  ctx.fillStyle = theme === "dark" ? "#0a0a0a" : "#f5f5f5";
  ctx.fillRect(0, 0, cssW, cssH);

  const fontSize = Math.round(cellSize * 0.85);
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const count = sortedGlyphs.chars.length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (r === undefined || g === undefined || b === undefined) continue;

      const lum = clamp(luminance(r, g, b) / 255, 0, 1);
      const adjusted = clamp(lum * contrast, 0, 1);

      const glyphIdx = brightnessToIndex(adjusted, count);
      const glyph = sortedGlyphs.chars[glyphIdx];
      if (!glyph || glyph === " ") continue;

      const cx = col * cellSize + cellSize / 2;
      const cy = row * cellSize + cellSize / 2;

      ctx.fillStyle = cbRamp(adjusted, theme);
      ctx.fillText(glyph, cx, cy);
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CameraState = "idle" | "requesting" | "active" | "denied" | "unavailable";

export default function WebcamAsciiPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sampleRef = useRef<SampleCtx | null>(null);
  const sizeRef = useRef<{ cssW: number; cssH: number; dpr: number } | null>(null);
  const sortedGlyphsRef = useRef<SortedGlyphs | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [contrast, setContrast] = useState(DEFAULT_CONTRAST);
  const [glyphSet, setGlyphSet] = useState<GlyphSetKey>("ascii");

  const cellSizeRef = useRef(cellSize);
  const contrastRef = useRef(contrast);
  const glyphSetRef = useRef(glyphSet);

  useEffect(() => {
    cellSizeRef.current = cellSize;
  }, [cellSize]);

  useEffect(() => {
    contrastRef.current = contrast;
  }, [contrast]);

  useEffect(() => {
    glyphSetRef.current = glyphSet;
  }, [glyphSet]);

  const { resolvedTheme } = useTheme();
  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // -------------------------------------------------------------------------
  // Build sorted glyph array whenever glyphSet or cellSize changes.
  // -------------------------------------------------------------------------

  useEffect(() => {
    const fontSize = Math.round(cellSize * 0.85);
    sortedGlyphsRef.current = buildSortedGlyphs(glyphSet, fontSize);
  }, [glyphSet, cellSize]);

  // -------------------------------------------------------------------------
  // Canvas resize (DPR-aware)
  // -------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = (): void => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;

      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      sizeRef.current = { cssW, cssH, dpr };

      const cs = cellSizeRef.current;
      const cols = Math.ceil(cssW / cs);
      const rows = Math.ceil(cssH / cs);
      sampleRef.current = makeSampleCtx(cols, rows);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Rebuild sample canvas when cellSize changes.
  useEffect(() => {
    const size = sizeRef.current;
    if (!size) return;
    const cols = Math.ceil(size.cssW / cellSize);
    const rows = Math.ceil(size.cssH / cellSize);
    sampleRef.current = makeSampleCtx(cols, rows);
  }, [cellSize]);

  // -------------------------------------------------------------------------
  // Camera enable / disable
  // -------------------------------------------------------------------------

  const stopStream = useCallback((): void => {
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  const enableCamera = useCallback(async (): Promise<void> => {
    setCameraState("requesting");
    setErrorMsg("");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
    } catch (err) {
      const name = err instanceof Error ? err.name : "unknown";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCameraState("denied");
        setErrorMsg("Camera permission was denied. Allow access in your browser settings.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setCameraState("unavailable");
        setErrorMsg("No camera found on this device.");
      } else {
        setCameraState("unavailable");
        setErrorMsg("Could not access the camera. Try reloading the page.");
      }
      return;
    }

    streamRef.current = stream;

    if (!videoRef.current) {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.autoplay = true;
      v.setAttribute("aria-hidden", "true");
      videoRef.current = v;
    }
    const video = videoRef.current;
    video.srcObject = stream;

    try {
      await video.play();
    } catch {
      // play() may be interrupted on unmount; ignore.
    }

    setCameraState("active");
  }, []);

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // -------------------------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------------------------

  useAnimationFrame(
    useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = sizeRef.current;
      if (!size) return;

      const { cssW, cssH, dpr } = size;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const currentTheme = themeRef.current;
      const video = videoRef.current;

      if (cameraState !== "active" || !video || video.readyState < 2) {
        if (cameraState === "denied" || cameraState === "unavailable") {
          ctx.fillStyle = currentTheme === "dark" ? "#0a0a0a" : "#f5f5f5";
          ctx.fillRect(0, 0, cssW, cssH);
          const fontSize = Math.round(clamp(Math.min(cssW, cssH) * 0.035, 11, 18));
          ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = currentTheme === "dark" ? "rgba(237,237,237,0.7)" : "rgba(10,10,10,0.7)";
          ctx.fillText(errorMsg, cssW / 2, cssH / 2);
        } else {
          drawPrompt(ctx, cssW, cssH, currentTheme);
        }
        return;
      }

      const sample = sampleRef.current;
      if (!sample) return;

      const glyphs = sortedGlyphsRef.current;
      if (!glyphs) return;

      drawAscii(
        ctx,
        sample,
        video,
        glyphs,
        cssW,
        cssH,
        cellSizeRef.current,
        contrastRef.current,
        currentTheme,
      );
    }, [cameraState, errorMsg]),
    { pauseWhenHidden: true },
  );

  // -------------------------------------------------------------------------
  // Control IDs
  // -------------------------------------------------------------------------

  const cellSizeLabelId = "webcam-ascii-cell-size-label";
  const contrastLabelId = "webcam-ascii-contrast-label";
  const glyphSetLabelId = "webcam-ascii-glyph-set-label";

  const showOverlay = cameraState === "idle" || cameraState === "requesting";

  return (
    <PlayShell
      slug="webcam-ascii"
      title="Webcam ASCII"
      visualLabel="Your camera redrawn as a grid of text glyphs; denser glyphs appear in darker areas."
      attribution={
        <>
          getUserMedia + Canvas 2D glyph-density mapping. Colorblind-safe text colors via the{" "}
          <a
            href="https://jfly.uni-koeln.de/color/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Okabe-Ito palette
          </a>
          . No external dependencies.
        </>
      }
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={glyphSetLabelId} className="text-xs text-foreground/70">
              glyphs
            </span>
            <select
              value={glyphSet}
              onChange={(e) => setGlyphSet(e.target.value as GlyphSetKey)}
              aria-labelledby={glyphSetLabelId}
              className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ascii">ASCII</option>
              <option value="blocks">Blocks</option>
              <option value="dots">Dots</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span id={cellSizeLabelId} className="text-xs text-foreground/70">
              cell size
            </span>
            <input
              type="range"
              min={MIN_CELL_SIZE}
              max={MAX_CELL_SIZE}
              step={1}
              value={cellSize}
              onChange={(e) => setCellSize(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={cellSizeLabelId}
              aria-valuemin={MIN_CELL_SIZE}
              aria-valuemax={MAX_CELL_SIZE}
              aria-valuenow={cellSize}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">
              {cellSize}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span id={contrastLabelId} className="text-xs text-foreground/70">
              contrast
            </span>
            <input
              type="range"
              min={MIN_CONTRAST}
              max={MAX_CONTRAST}
              step={STEP_CONTRAST}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={contrastLabelId}
              aria-valuemin={MIN_CONTRAST}
              aria-valuemax={MAX_CONTRAST}
              aria-valuenow={contrast}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {contrast.toFixed(1)}
            </span>
          </div>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        suppressHydrationWarning
        style={{
          background: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
        }}
        aria-label="Webcam feed redrawn as a grid of text glyphs; denser characters appear in darker areas."
      />

      {showOverlay ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={() => void enableCamera()}
            disabled={cameraState === "requesting"}
            className="rounded-lg border border-foreground/20 bg-background/90 px-6 py-3 text-sm font-medium text-foreground/90 backdrop-blur-sm transition-colors hover:border-foreground/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 disabled:cursor-wait disabled:opacity-60"
          >
            {cameraState === "requesting" ? "Requesting access..." : "Enable camera"}
          </button>
        </div>
      ) : null}
    </PlayShell>
  );
}
