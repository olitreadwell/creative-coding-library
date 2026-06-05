"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clamp, hslString, hsl, useAnimationFrame } from "@/lib/creative";

type AudioState =
  | { status: "idle" }
  | { status: "active"; ctx: AudioContext; analyser: AnalyserNode; stream: MediaStream }
  | { status: "error"; message: string };

const FFT_SIZE = 2048;
const BAR_COUNT_OPTIONS = [32, 64, 128, 256] as const;
type BarCount = (typeof BAR_COUNT_OPTIONS)[number];

function stopAudio(state: AudioState): void {
  if (state.status !== "active") return;
  state.analyser.disconnect();
  state.stream.getTracks().forEach((t) => t.stop());
  void state.ctx.close();
}

function barColor(index: number, total: number, amplitude: number): string {
  const t = total > 1 ? index / (total - 1) : 0;
  const amp = clamp(amplitude / 255, 0, 1);
  // Protanopia-safe ramp: blue (220) -> cyan (180) -> yellow-green (80)
  const hue = 220 - t * 140;
  const sat = 0.7 + amp * 0.3;
  const light = 0.25 + amp * 0.45;
  return hslString(hsl(hue, sat, light));
}

function drawPrompt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: string,
  fg: string,
): void {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = fg;
  ctx.font = `${Math.max(12, Math.round(w * 0.022))}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Enable microphone to see your spectrum", w / 2, h / 2);
}

function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  barCount: number,
  gain: number,
  w: number,
  h: number,
  bg: string,
): void {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const step = Math.floor(data.length / barCount);
  const gap = Math.max(1, Math.round(w * 0.003));
  const barW = (w - gap * (barCount + 1)) / barCount;
  if (barW < 1) return;

  for (let i = 0; i < barCount; i++) {
    const binIndex = i * step;
    const rawVal = data[binIndex] ?? 0;
    const val = clamp(rawVal * gain, 0, 255);
    const barH = (val / 255) * (h - gap * 2);
    const x = gap + i * (barW + gap);
    const y = h - gap - barH;

    ctx.fillStyle = barColor(i, barCount, val);
    ctx.fillRect(x, y, barW, barH);
  }
}

export default function MicSpectrumPlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioState>({ status: "idle" });
  const [audioStatus, setAudioStatus] = useState<"idle" | "active" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Controls
  const [gain, setGain] = useState<number>(1.5);
  const [smoothing, setSmoothing] = useState<number>(0.8);
  const [barCount, setBarCount] = useState<BarCount>(64);

  const smoothingRef = useRef(smoothing);
  const gainRef = useRef(gain);
  const barCountRef = useRef(barCount);

  useEffect(() => {
    smoothingRef.current = smoothing;
    if (audioRef.current.status === "active") {
      audioRef.current.analyser.smoothingTimeConstant = smoothing;
    }
  }, [smoothing]);

  useEffect(() => {
    gainRef.current = gain;
  }, [gain]);

  useEffect(() => {
    barCountRef.current = barCount;
  }, [barCount]);

  // DPR-aware resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const enableMic = useCallback(async () => {
    if (audioRef.current.status === "active") return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in browser settings and try again."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "No microphone was found on this device."
            : "Could not access the microphone.";
      audioRef.current = { status: "error", message: msg };
      setErrorMsg(msg);
      setAudioStatus("error");
      return;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = smoothingRef.current;
    source.connect(analyser);

    audioRef.current = { status: "active", ctx, analyser, stream };
    setAudioStatus("active");
  }, []);

  const disableMic = useCallback(() => {
    stopAudio(audioRef.current);
    audioRef.current = { status: "idle" };
    setAudioStatus("idle");
    setErrorMsg("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio(audioRef.current);
    };
  }, []);

  const dataRef = useRef<Uint8Array | null>(null);

  useAnimationFrame(
    useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cssW = w / dpr;
      const cssH = h / dpr;

      const bg = "#0a0a0a";
      const fg = "rgba(237,237,237,0.7)";

      const state = audioRef.current;
      if (state.status !== "active") {
        drawPrompt(ctx2d, cssW, cssH, bg, fg);
        return;
      }

      const binCount = state.analyser.frequencyBinCount;
      if (!dataRef.current || dataRef.current.length !== binCount) {
        dataRef.current = new Uint8Array(binCount);
      }
      state.analyser.getByteFrequencyData(dataRef.current);

      drawSpectrum(ctx2d, dataRef.current, barCountRef.current, gainRef.current, cssW, cssH, bg);
    }, []),
    { pauseWhenHidden: true, respectReducedMotion: true },
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-[#ededed]">
      <header className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
        <Link
          href="/mic-spectrum"
          className="text-sm text-foreground/70 underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          ← Mic Spectrum
        </Link>
        <span className="text-sm font-medium">Play</span>
      </header>

      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          suppressHydrationWarning
          style={{ background: "#0a0a0a" }}
          aria-label="Microphone frequency spectrum visualization"
        />

        {audioStatus !== "active" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {audioStatus === "error" ? (
              <p
                role="alert"
                className="max-w-xs rounded border border-red-500/40 bg-red-950/60 px-4 py-3 text-center text-sm text-red-300"
              >
                {errorMsg}
              </p>
            ) : null}
            <button
              onClick={enableMic}
              className="rounded bg-[#ededed] px-5 py-2.5 text-sm font-medium text-[#0a0a0a] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Enable microphone
            </button>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
          {audioStatus === "active" && (
            <button
              onClick={disableMic}
              className="rounded border border-white/20 px-3 py-1.5 text-xs hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Disable microphone
            </button>
          )}

          <div className="flex items-center gap-3">
            <span id="gain-label" className="text-xs text-foreground/70">
              Gain
            </span>
            <input
              type="range"
              aria-labelledby="gain-label"
              aria-valuemin={0.5}
              aria-valuemax={4}
              aria-valuenow={gain}
              min={0.5}
              max={4}
              step={0.1}
              value={gain}
              onChange={(e) => setGain(Number(e.target.value))}
              className="w-28 accent-white"
            />
            <span className="w-8 text-right text-xs tabular-nums text-foreground/70">
              {gain.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span id="smooth-label" className="text-xs text-foreground/70">
              Smoothing
            </span>
            <input
              type="range"
              aria-labelledby="smooth-label"
              aria-valuemin={0}
              aria-valuemax={0.99}
              aria-valuenow={smoothing}
              min={0}
              max={0.99}
              step={0.01}
              value={smoothing}
              onChange={(e) => setSmoothing(Number(e.target.value))}
              className="w-28 accent-white"
            />
            <span className="w-8 text-right text-xs tabular-nums text-foreground/70">
              {smoothing.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span id="bars-label" className="text-xs text-foreground/70">
              Bars
            </span>
            <select
              aria-labelledby="bars-label"
              value={barCount}
              onChange={(e) => setBarCount(Number(e.target.value) as BarCount)}
              className="rounded border border-white/20 bg-transparent px-2 py-1 text-xs text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {BAR_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </footer>
    </div>
  );
}
