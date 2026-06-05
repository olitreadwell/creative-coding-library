"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp, clamp } from "@/lib/creative";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CELL_SIZE = 12;
const MIN_CELL_SIZE = 4;
const MAX_CELL_SIZE = 32;

const DEFAULT_INTENSITY = 1.0;
const MIN_INTENSITY = 0.2;
const MAX_INTENSITY = 2.0;
const STEP_INTENSITY = 0.05;

const PROMPT_TEXT = "Click \"Enable camera\" to start";

// ---------------------------------------------------------------------------
// Luminance helper (BT.601 coefficients)
// ---------------------------------------------------------------------------

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// ---------------------------------------------------------------------------
// Offscreen sample canvas (re-used across frames)
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
// Draw: prompt (no stream)
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
// Draw: dot grid from video
// ---------------------------------------------------------------------------

function drawDots(
  ctx: CanvasRenderingContext2D,
  sample: SampleCtx,
  video: HTMLVideoElement,
  cssW: number,
  cssH: number,
  cellSize: number,
  intensity: number,
  theme: "dark" | "light",
): void {
  const { cols, rows } = sample;

  // Mirror horizontally (selfie view).
  sample.ctx.save();
  sample.ctx.translate(cols, 0);
  sample.ctx.scale(-1, 1);
  sample.ctx.drawImage(video, 0, 0, cols, rows);
  sample.ctx.restore();

  const pixels = sample.ctx.getImageData(0, 0, cols, rows);
  const data = pixels.data;

  ctx.fillStyle = theme === "dark" ? "#0a0a0a" : "#f5f5f5";
  ctx.fillRect(0, 0, cssW, cssH);

  const halfCell = cellSize / 2;
  const maxRadius = halfCell * 0.9;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (r === undefined || g === undefined || b === undefined) continue;

      const lum = clamp(luminance(r, g, b) / 255, 0, 1);
      const adjusted = clamp(lum * intensity, 0, 1);

      const cx = col * cellSize + halfCell;
      const cy = row * cellSize + halfCell;
      const radius = adjusted * maxRadius;

      if (radius < 0.5) continue;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = cbRamp(adjusted, theme);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CameraState = "idle" | "requesting" | "active" | "denied" | "unavailable";

export default function WebcamMirrorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sampleRef = useRef<SampleCtx | null>(null);
  const sizeRef = useRef<{ cssW: number; cssH: number; dpr: number } | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [intensity, setIntensity] = useState(DEFAULT_INTENSITY);

  const cellSizeRef = useRef(cellSize);
  const intensityRef = useRef(intensity);

  useEffect(() => {
    cellSizeRef.current = cellSize;
  }, [cellSize]);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  const { resolvedTheme } = useTheme();
  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

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

      const currentCellSize = cellSizeRef.current;
      const cols = Math.ceil(cssW / currentCellSize);
      const rows = Math.ceil(cssH / currentCellSize);
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

    let video = videoRef.current;
    if (!video) {
      video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute("aria-hidden", "true");
      videoRef.current = video;
    }
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

      if (
        cameraState !== "active" ||
        !video ||
        video.readyState < 2
      ) {
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

      drawDots(
        ctx,
        sample,
        video,
        cssW,
        cssH,
        cellSizeRef.current,
        intensityRef.current,
        currentTheme,
      );
    }, [cameraState, errorMsg]),
    { pauseWhenHidden: true },
  );

  // -------------------------------------------------------------------------
  // Control IDs
  // -------------------------------------------------------------------------

  const cellSizeLabelId = "webcam-mirror-cell-size-label";
  const intensityLabelId = "webcam-mirror-intensity-label";

  // -------------------------------------------------------------------------
  // Enable-camera overlay
  // -------------------------------------------------------------------------

  const showOverlay = cameraState === "idle" || cameraState === "requesting";

  return (
    <PlayShell
      slug="webcam-mirror"
      title="Webcam Mirror"
      visualLabel="Your camera redrawn as a grid of colored dots sized by brightness"
      attribution={
        <>
          getUserMedia + Canvas 2D brightness sampling. Colorblind-safe dot
          colors via the{" "}
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
            <span id={cellSizeLabelId} className="text-xs text-foreground/70">
              dot size
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
            <span id={intensityLabelId} className="text-xs text-foreground/70">
              contrast
            </span>
            <input
              type="range"
              min={MIN_INTENSITY}
              max={MAX_INTENSITY}
              step={STEP_INTENSITY}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={intensityLabelId}
              aria-valuemin={MIN_INTENSITY}
              aria-valuemax={MAX_INTENSITY}
              aria-valuenow={intensity}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {intensity.toFixed(1)}
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
        aria-label="Webcam feed redrawn as a grid of colored dots; dot size reflects pixel brightness."
      />

      {showOverlay ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={() => void enableCamera()}
            disabled={cameraState === "requesting"}
            className="rounded-lg border border-foreground/20 bg-background/90 px-6 py-3 text-sm font-medium text-foreground/90 backdrop-blur-sm transition-colors hover:border-foreground/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 disabled:cursor-wait disabled:opacity-60"
          >
            {cameraState === "requesting" ? "Requesting access…" : "Enable camera"}
          </button>
        </div>
      ) : null}
    </PlayShell>
  );
}
