"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp, lerp } from "@/lib/creative/math";
import { PlayShell } from "@/components/play-shell";
import { logBandEdges, bandLevel, shelfGain, vertexBand, NUM_BANDS } from "../field";

const DETAIL = 4; // icosahedron subdivision; higher = smoother, more vertices
const BASE_RADIUS = 3;
const DISPLACE = 1.7; // world units a fully-loud band pushes a vertex outward
const SPIN_SPEED = 0.12; // slow idle rotation, radians/sec

const FFT_SIZE = 2048;
const INPUT_GAIN = 1.7;
const ENERGY_EXP = 0.5;
// Per-band envelope: snap up to peaks, ease down (responsive, no jitter).
const ATTACK = 0.6;
const RELEASE = 0.12;
// Noise gate: ignore anything below this fraction of full scale, so room tone
// and faint keyboard clicks leave the sphere still.
const NOISE_GATE = 0.16;
// Cold (quiet) to hot (loud), in HSL hue degrees: 240 = blue, 0 = red.
const HUE_COLD = 240;
const HUE_HOT = 0;

function gate(v: number): number {
  return v <= NOISE_GATE ? 0 : (v - NOISE_GATE) / (1 - NOISE_GATE);
}

interface SpectrumSphereProps {
  isLight: boolean;
  audioGain: number;
  analyserRef: React.RefObject<AnalyserNode | null>;
  audioDataRef: React.RefObject<Uint8Array<ArrayBuffer> | null>;
}

function SpectrumSphere({
  isLight,
  audioGain,
  analyserRef,
  audioDataRef,
}: SpectrumSphereProps): React.ReactElement {
  const meshRef = useRef<THREE.Mesh>(null);

  // Build the sphere once and cache each vertex's unit direction and band.
  const { geometry, dirs, bands } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, DETAIL);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const n = pos.count;
    const dirs = new Float32Array(n * 3);
    const bands = new Int16Array(n);
    for (let i = 0; i < n; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const len = Math.hypot(x, y, z) || 1;
      dirs[i * 3] = x / len;
      dirs[i * 3 + 1] = y / len;
      dirs[i * 3 + 2] = z / len;
      bands[i] = vertexBand(y / len, 1, NUM_BANDS);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return { geometry: geo, dirs, bands };
  }, []);

  // Smoothed energy per band, carried between frames for the envelope.
  const bandEnv = useRef<Float32Array>(new Float32Array(NUM_BANDS));
  const edgesRef = useRef<number[] | null>(null);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y += delta * SPIN_SPEED;

    const env = bandEnv.current;

    // 1. Read the spectrum and update the per-band envelope.
    const analyser = analyserRef.current;
    if (analyser) {
      const binCount = analyser.frequencyBinCount;
      if (!audioDataRef.current || audioDataRef.current.length !== binCount) {
        audioDataRef.current = new Uint8Array(binCount);
      }
      const data = audioDataRef.current;
      analyser.getByteFrequencyData(data);

      const usableBins = Math.max(NUM_BANDS, Math.floor(binCount * 0.7));
      if (!edgesRef.current || edgesRef.current.length !== NUM_BANDS + 1) {
        edgesRef.current = logBandEdges(NUM_BANDS, usableBins);
      }
      const edges = edgesRef.current;

      for (let b = 0; b < NUM_BANDS; b++) {
        const raw = gate(
          bandLevel(data, edges[b] ?? 0, edges[b + 1] ?? 0) * shelfGain(b, NUM_BANDS),
        );
        const target = Math.pow(clamp(raw * INPUT_GAIN, 0, 1), ENERGY_EXP);
        const prev = env[b] ?? 0;
        env[b] = prev + (target - prev) * (target > prev ? ATTACK : RELEASE);
      }
    } else {
      // No mic: ease every band back to rest so the sphere settles smooth.
      for (let b = 0; b < NUM_BANDS; b++) env[b] = (env[b] ?? 0) * (1 - RELEASE);
    }

    // 2. Displace and recolor every vertex from its band's energy.
    const geo = mesh.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const colAttr = geo.attributes.color as THREE.BufferAttribute;
    const count = posAttr.count;
    for (let i = 0; i < count; i++) {
      const energy = clamp((env[bands[i] ?? 0] ?? 0) * audioGain, 0, 1);
      const r = BASE_RADIUS + energy * DISPLACE;
      posAttr.setXYZ(
        i,
        (dirs[i * 3] ?? 0) * r,
        (dirs[i * 3 + 1] ?? 0) * r,
        (dirs[i * 3 + 2] ?? 0) * r,
      );

      const hue = lerp(HUE_COLD, HUE_HOT, energy);
      tmpColor.setHSL(hue / 360, 0.9, (isLight ? 0.45 : 0.5) + energy * 0.22);
      colAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

type MicStatus = "idle" | "active" | "error";

export default function SphereSpectrumPage(): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isLight = (resolvedTheme ?? "dark") === "light";

  const [audioPct, setAudioPct] = useState<number>(100);
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const bgColor = isLight ? "#eef0f4" : "#07080d";
  const audioGain = audioPct / 100;

  const stopMic = useCallback(() => {
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }
  }, []);

  const enableMic = useCallback(async () => {
    if (analyserRef.current) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in your browser settings and try again."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "No microphone was found on this device."
            : "Could not access the microphone.";
      setErrorMsg(msg);
      setMicStatus("error");
      return;
    }
    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // some browsers resume lazily on first read
      }
    }
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    // Light smoothing here; the per-band envelope does the rest.
    analyser.smoothingTimeConstant = 0.65;
    source.connect(analyser);

    ctxRef.current = ctx;
    streamRef.current = stream;
    analyserRef.current = analyser;
    setMicStatus("active");
    setErrorMsg("");
  }, []);

  const disableMic = useCallback(() => {
    stopMic();
    setMicStatus("idle");
    setErrorMsg("");
  }, [stopMic]);

  useEffect(() => () => stopMic(), [stopMic]);

  const micActive = micStatus === "active";

  return (
    <PlayShell
      slug="sphere-spectrum"
      title="Sphere Spectrum"
      animated={false}
      visualLabel="A slowly turning sphere whose surface erupts into colored peaks driven by your microphone: louder sounds push out hotter, taller spikes; quiet stays smooth and cold."
      controls={
        <>
          <button
            type="button"
            onClick={micActive ? disableMic : () => void enableMic()}
            className="text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {micActive ? "Mic off" : "Enable microphone"}
          </button>
          <div className="flex items-center gap-2">
            <span id="ss-audio" className="text-xs text-foreground/70">
              audio
            </span>
            <input
              type="range"
              min={0}
              max={300}
              value={audioPct}
              onChange={(e) => setAudioPct(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby="ss-audio"
              aria-valuemin={0}
              aria-valuemax={300}
              aria-valuenow={audioPct}
            />
            <span className="w-9 text-right text-xs text-foreground/70 tabular-nums">
              {audioGain.toFixed(2)}
            </span>
          </div>
        </>
      }
      attribution={
        <>
          React Three Fiber + three.js. An icosphere displaced per vertex by a Web Audio FFT,
          grouped into log-frequency bands. Height and color track loudness.
        </>
      }
    >
      <Canvas
        camera={{ position: [3.5, 2.2, 8.5], fov: 45 }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <color attach="background" args={[bgColor]} />
        <ambientLight intensity={isLight ? 1.0 : 0.55} />
        <directionalLight position={[6, 10, 6]} intensity={isLight ? 2.4 : 2.0} color="#ffffff" />
        <directionalLight
          position={[-8, -2, -4]}
          intensity={isLight ? 0.8 : 0.7}
          color={isLight ? "#7a8aff" : "#9aa6ff"}
        />
        <pointLight position={[0, 3, 6]} intensity={isLight ? 40 : 32} color="#ff9f7a" decay={2} />
        <SpectrumSphere
          isLight={isLight}
          audioGain={audioGain}
          analyserRef={analyserRef}
          audioDataRef={audioDataRef}
        />
      </Canvas>

      {micStatus === "error" ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <p
            role="alert"
            className="max-w-sm rounded-md border border-border bg-background/90 px-4 py-2 text-sm text-foreground/80"
          >
            {errorMsg}
          </p>
        </div>
      ) : null}
    </PlayShell>
  );
}
