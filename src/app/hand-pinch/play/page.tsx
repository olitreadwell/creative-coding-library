"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { clamp, lerp, TAU } from "@/lib/creative/math";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { pinchDistance, isPinching, midpoint, type Point2 } from "../handpinch";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const DARK_BG = "#06080e";
const LIGHT_BG = "#f3f4f7";
type Theme = "light" | "dark";
type Status = "idle" | "loading" | "active" | "error";

type Jelly = { cx: number; cy: number; w: number; h: number };

export default function HandPinchPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const handsRef = useRef<NormalizedLandmark[][]>([]);
  const jellyRef = useRef<Jelly>({ cx: 0, cy: 0, w: 0, h: 0 });
  const sensitivityRef = useRef<number>(0.07);

  const [status, setStatus] = useState<Status>("idle");
  const statusRef = useRef<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [sensitivity, setSensitivity] = useState<number>(0.07);

  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";
  const bg = theme === "light" ? LIGHT_BG : DARK_BG;
  const themeRef = useRef<Theme>(theme);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

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
      if (jellyRef.current.w === 0) {
        jellyRef.current = { cx: w / 2, cy: h / 2, w: w * 0.28, h: w * 0.28 };
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    handsRef.current = [];
    lastVideoTimeRef.current = -1;
  }, []);

  const enable = useCallback(async () => {
    if (statusRef.current === "loading" || statusRef.current === "active") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (!videoRef.current) {
        const v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        v.autoplay = true;
        videoRef.current = v;
      }
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      const opts = {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "VIDEO" as const,
        numHands: 2,
      };
      let hl: HandLandmarker;
      try {
        hl = await vision.HandLandmarker.createFromOptions(fileset, {
          ...opts,
          baseOptions: { ...opts.baseOptions, delegate: "GPU" },
        });
      } catch {
        hl = await vision.HandLandmarker.createFromOptions(fileset, {
          ...opts,
          baseOptions: { ...opts.baseOptions, delegate: "CPU" },
        });
      }
      landmarkerRef.current = hl;
      setStatus("active");
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      const msg =
        name === "NotAllowedError"
          ? "Camera access was denied. Allow it in your browser settings and try again."
          : name === "NotFoundError"
            ? "No camera was found on this device."
            : "Could not start the hand tracker. Check your connection and try again.";
      setErrorMsg(msg);
      setStatus("error");
      stop();
    }
  }, [stop]);

  const disable = useCallback(() => {
    stop();
    setStatus("idle");
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  useAnimationFrame(
    useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const t = themeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = t === "light" ? LIGHT_BG : DARK_BG;
      ctx.fillRect(0, 0, cssW, cssH);

      const video = videoRef.current;
      const hl = landmarkerRef.current;
      if (statusRef.current !== "active" || !video || !hl) return;

      // Detect hands only when a fresh video frame is available.
      if (video.currentTime !== lastVideoTimeRef.current && video.readyState >= 2) {
        lastVideoTimeRef.current = video.currentTime;
        const result = hl.detectForVideo(video, performance.now());
        handsRef.current = result.landmarks ?? [];
      }

      // Draw the camera, mirrored and dimmed, as a backdrop.
      ctx.save();
      ctx.globalAlpha = t === "light" ? 0.35 : 0.45;
      ctx.translate(cssW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, cssW, cssH);
      ctx.restore();

      // Convert a normalized landmark to mirrored canvas coordinates.
      const toCanvas = (lm: Point2): Point2 => ({
        x: (1 - lm.x) * cssW,
        y: lm.y * cssH,
      });

      const hands = handsRef.current;
      const grabs: Point2[] = [];

      for (let h = 0; h < hands.length; h++) {
        const hand = hands[h];
        if (!hand) continue;
        const thumb = hand[4];
        const index = hand[8];
        // Draw the fingertips/landmarks as small dots.
        ctx.fillStyle = cbColor(h, t);
        for (const lm of hand) {
          const p = toCanvas(lm);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, TAU);
          ctx.fill();
        }
        if (!thumb || !index) continue;
        const d = pinchDistance({ x: thumb.x, y: thumb.y }, { x: index.x, y: index.y });
        if (isPinching(d, sensitivityRef.current)) {
          const grab = toCanvas(midpoint(thumb, index));
          grabs.push(grab);
          ctx.strokeStyle = cbColor(h, t);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(grab.x, grab.y, 16, 0, TAU);
          ctx.stroke();
        }
      }

      // Update the jelly target from the pinches.
      const jelly = jellyRef.current;
      let targetCx = jelly.cx;
      let targetCy = jelly.cy;
      let targetW = jelly.w;
      let targetH = jelly.h;
      const restSize = Math.min(cssW, cssH) * 0.28;

      if (grabs.length >= 2) {
        const a = grabs[0]!;
        const b = grabs[1]!;
        targetCx = (a.x + b.x) / 2;
        targetCy = (a.y + b.y) / 2;
        targetW = Math.max(restSize * 0.4, Math.abs(a.x - b.x));
        targetH = Math.max(restSize * 0.4, Math.abs(a.y - b.y));
      } else if (grabs.length === 1) {
        const a = grabs[0]!;
        targetCx = a.x;
        targetCy = a.y;
        targetW = lerp(jelly.w, restSize, 0.08);
        targetH = lerp(jelly.h, restSize, 0.08);
      } else {
        targetW = lerp(jelly.w, restSize, 0.05);
        targetH = lerp(jelly.h, restSize, 0.05);
      }

      jelly.cx = lerp(jelly.cx, targetCx, 0.25);
      jelly.cy = lerp(jelly.cy, targetCy, 0.25);
      jelly.w = lerp(jelly.w, targetW, 0.25);
      jelly.h = lerp(jelly.h, targetH, 0.25);

      // Draw the stretchy jelly as a wobbly rounded blob.
      const time = performance.now() / 1000;
      const rx = Math.max(8, jelly.w / 2);
      const ry = Math.max(8, jelly.h / 2);
      ctx.fillStyle = cbColor(grabs.length >= 2 ? 3 : 2, t);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      const STEPS = 48;
      for (let i = 0; i <= STEPS; i++) {
        const a = (i / STEPS) * TAU;
        const wob = 1 + Math.sin(a * 5 + time * 2) * 0.04;
        const x = jelly.cx + Math.cos(a) * rx * wob;
        const y = jelly.cy + Math.sin(a) * ry * wob;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }, []),
    { pauseWhenHidden: true },
  );

  const active = status === "active";
  const labelClass = "text-xs text-foreground/70";
  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="hand-pinch"
      title="Hand Pinch"
      visualLabel="Pinch your thumb and finger in front of the camera to grab and stretch a blob."
      controls={
        <>
          <button type="button" onClick={active ? disable : enable} className={btnClass}>
            {status === "loading" ? "Loading..." : active ? "Stop camera" : "Enable camera"}
          </button>
          <div className="flex items-center gap-2">
            <span id="hp-sens" className={labelClass}>
              pinch sensitivity
            </span>
            <input
              type="range"
              min={0.03}
              max={0.14}
              step={0.005}
              value={sensitivity}
              onChange={(e) => setSensitivity(clamp(Number(e.target.value), 0.03, 0.14))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby="hp-sens"
              aria-valuemin={0.03}
              aria-valuemax={0.14}
              aria-valuenow={sensitivity}
            />
          </div>
        </>
      }
      attribution={
        <>
          Hand tracking by MediaPipe Tasks Vision. Pinch to grab; pinch with both hands to stretch.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="A blob you grab and stretch by pinching your thumb and finger in front of the camera. Pinch with one hand to move it, with both hands to stretch it. Use the Enable camera button to start."
        suppressHydrationWarning
        style={{ background: bg }}
      />
      {!active ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
          {status === "error" ? (
            <p
              role="alert"
              className="max-w-sm rounded-md border border-border bg-background/90 px-4 py-3 text-sm text-foreground/80"
            >
              {errorMsg}
            </p>
          ) : (
            <p className="max-w-sm text-sm text-foreground/70">
              Pinch your thumb and finger to grab the blob. Pinch with both hands to stretch it.
            </p>
          )}
          <button
            type="button"
            onClick={enable}
            disabled={status === "loading"}
            className="pointer-events-auto rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {status === "loading" ? "Loading hand tracker..." : "Enable camera"}
          </button>
        </div>
      ) : null}
    </PlayShell>
  );
}
