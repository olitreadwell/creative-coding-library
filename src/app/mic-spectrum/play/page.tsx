"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbRamp } from "@/lib/creative";
import { clamp } from "@/lib/creative/math";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";

type AudioState =
  | { status: "idle" }
  | { status: "active"; ctx: AudioContext; analyser: AnalyserNode; stream: MediaStream }
  | { status: "error"; message: string };

const FFT_SIZE = 2048;
const BAR_COUNT_OPTIONS = [32, 64, 128, 256] as const;
type BarCount = (typeof BAR_COUNT_OPTIONS)[number];
type Theme = "light" | "dark";

const DARK_BG = "#0a0a0f";
const LIGHT_BG = "#f4f5f8";

function stopAudio(state: AudioState): void {
  if (state.status !== "active") return;
  state.analyser.disconnect();
  state.stream.getTracks().forEach((t) => t.stop());
  void state.ctx.close();
}

export default function MicSpectrumPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioState>({ status: "idle" });
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const [audioStatus, setAudioStatus] = useState<"idle" | "active" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [gain, setGain] = useState<number>(1.5);
  const [smoothing, setSmoothing] = useState<number>(0.8);
  const [barCount, setBarCount] = useState<BarCount>(64);
  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";
  const bg = theme === "light" ? LIGHT_BG : DARK_BG;

  const gainRef = useRef(gain);
  const barCountRef = useRef(barCount);
  const themeRef = useRef<Theme>(theme);
  useEffect(() => {
    gainRef.current = gain;
  }, [gain]);
  useEffect(() => {
    barCountRef.current = barCount;
  }, [barCount]);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    if (audioRef.current.status === "active") {
      audioRef.current.analyser.smoothingTimeConstant = smoothing;
    }
  }, [smoothing]);

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
    };
    fit();
    const ro = new ResizeObserver(fit);
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
          ? "Microphone access was denied. Allow it in your browser settings and try again."
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
    analyser.smoothingTimeConstant = smoothing;
    source.connect(analyser);
    audioRef.current = { status: "active", ctx, analyser, stream };
    setAudioStatus("active");
    setErrorMsg("");
  }, [smoothing]);

  const disableMic = useCallback(() => {
    stopAudio(audioRef.current);
    audioRef.current = { status: "idle" };
    setAudioStatus("idle");
    setErrorMsg("");
  }, []);

  useEffect(() => {
    return () => stopAudio(audioRef.current);
  }, []);

  useAnimationFrame(
    useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const t = themeRef.current;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.fillStyle = t === "light" ? LIGHT_BG : DARK_BG;
      ctx2d.fillRect(0, 0, cssW, cssH);

      const state = audioRef.current;
      if (state.status !== "active") return;

      const binCount = state.analyser.frequencyBinCount;
      if (!dataRef.current || dataRef.current.length !== binCount) {
        dataRef.current = new Uint8Array(binCount);
      }
      const data = dataRef.current;
      state.analyser.getByteFrequencyData(data);

      const bars = barCountRef.current;
      const g = gainRef.current;
      const step = Math.max(1, Math.floor(data.length / bars));
      const gap = Math.max(1, Math.round(cssW * 0.003));
      const barW = (cssW - gap * (bars + 1)) / bars;
      if (barW < 1) return;

      for (let i = 0; i < bars; i++) {
        const val = clamp((data[i * step] ?? 0) * g, 0, 255);
        const barH = (val / 255) * (cssH - gap * 2);
        const x = gap + i * (barW + gap);
        ctx2d.fillStyle = cbRamp(i / Math.max(1, bars - 1), t);
        ctx2d.fillRect(x, cssH - gap - barH, barW, barH);
      }
    }, []),
    { pauseWhenHidden: true },
  );

  const active = audioStatus === "active";
  const labelClass = "text-xs text-foreground/70";
  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const selectClass =
    "text-sm rounded border border-border bg-background text-foreground/80 hover:text-foreground px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="mic-spectrum"
      title="Mic Spectrum"
      visualLabel="A live frequency spectrum driven by your microphone."
      controls={
        <>
          <button type="button" onClick={active ? disableMic : enableMic} className={btnClass}>
            {active ? "Mic off" : "Enable microphone"}
          </button>
          <div className="flex items-center gap-2">
            <span id="ms-gain" className={labelClass}>
              gain
            </span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.1}
              value={gain}
              onChange={(e) => setGain(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="ms-gain"
              aria-valuemin={0.5}
              aria-valuemax={4}
              aria-valuenow={gain}
            />
          </div>
          <div className="flex items-center gap-2">
            <span id="ms-smooth" className={labelClass}>
              smoothing
            </span>
            <input
              type="range"
              min={0}
              max={0.95}
              step={0.05}
              value={smoothing}
              onChange={(e) => setSmoothing(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="ms-smooth"
              aria-valuemin={0}
              aria-valuemax={0.95}
              aria-valuenow={smoothing}
            />
          </div>
          <div className="flex items-center gap-2">
            <label id="ms-bars" htmlFor="ms-bars-select" className={labelClass}>
              bars
            </label>
            <select
              id="ms-bars-select"
              value={barCount}
              onChange={(e) => setBarCount(Number(e.target.value) as BarCount)}
              className={selectClass}
              aria-labelledby="ms-bars"
            >
              {BAR_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </>
      }
      attribution={
        <>Technique: getUserMedia microphone + Web Audio AnalyserNode FFT on Canvas 2D.</>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="A live frequency spectrum driven by your microphone. Use the Enable microphone button to start."
        suppressHydrationWarning
        style={{ background: bg }}
      />
      {!active ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
          {audioStatus === "error" ? (
            <p
              role="alert"
              className="max-w-sm rounded-md border border-border bg-background/90 px-4 py-3 text-sm text-foreground/80"
            >
              {errorMsg}
            </p>
          ) : null}
          <button
            type="button"
            onClick={enableMic}
            className="pointer-events-auto rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Enable microphone
          </button>
        </div>
      ) : null}
    </PlayShell>
  );
}
