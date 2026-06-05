"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import type { Renderer as OGLRenderer, Program as OGLProgram, Mesh as OGLMesh } from "ogl";
import { vertex, fragment, paletteSpeed, type PaletteLabel } from "../shader";

const PALETTE_LABELS: PaletteLabel[] = ["calm", "warm", "wild"];

/** Default speed multiplier applied to uTime before passing to the shader. */
const DEFAULT_SPEED = 1.0;
/** Default spatial scale: 1.0 = same as original (uv unchanged). */
const DEFAULT_SCALE = 1.0;
/** Default contrast: 1.0 = unchanged output. */
const DEFAULT_CONTRAST = 1.0;

/** Per-palette base uSpeed fed into the shader's driven computation. */
const SPEED_BASE = 0.4;

export default function ShaderGradientPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  // UI state — drives re-render so label readouts stay live.
  const [palette, setPalette] = useState<PaletteLabel>("calm");
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEED);
  const [scale, setScale] = useState<number>(DEFAULT_SCALE);
  const [contrast, setContrast] = useState<number>(DEFAULT_CONTRAST);

  // Refs expose live values to the animation loop without triggering re-renders.
  const paletteRef = useRef<PaletteLabel>("calm");
  const speedRef = useRef<number>(DEFAULT_SPEED);
  const scaleRef = useRef<number>(DEFAULT_SCALE);
  const contrastRef = useRef<number>(DEFAULT_CONTRAST);
  const programRef = useRef<OGLProgram | null>(null);
  const rendererRef = useRef<OGLRenderer | null>(null);
  const meshRef = useRef<OGLMesh | null>(null);

  // useAnimationFrame already honors prefers-reduced-motion internally
  // (runs one static frame then stops), so no manual detection is needed here.

  // Sync palette state -> ref -> shader uniforms.
  useEffect(() => {
    paletteRef.current = palette;
    const prog = programRef.current;
    if (!prog) return;
    prog.uniforms["uSeed"] = { value: paletteSpeed(palette) };
    prog.uniforms["uSpeed"] = { value: SPEED_BASE + paletteSpeed(palette) * 0.06 };
  }, [palette]);

  // Sync speed state -> ref (shader reads from ref each frame).
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Sync scale state -> ref -> shader uniform immediately.
  useEffect(() => {
    scaleRef.current = scale;
    const prog = programRef.current;
    if (!prog) return;
    prog.uniforms["uScale"] = { value: scale };
  }, [scale]);

  // Sync contrast state -> ref -> shader uniform immediately.
  useEffect(() => {
    contrastRef.current = contrast;
    const prog = programRef.current;
    if (!prog) return;
    prog.uniforms["uContrast"] = { value: contrast };
  }, [contrast]);

  // Push theme as a float uniform: 1.0 = light, 0.0 = dark.
  useEffect(() => {
    const prog = programRef.current;
    if (!prog) return;
    const themeValue = (resolvedTheme ?? "dark") === "light" ? 1.0 : 0.0;
    prog.uniforms["uTheme"] = { value: themeValue };
  }, [resolvedTheme]);

  // Bootstrap ogl inside an effect so WebGL only runs client-side.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeObserver: ResizeObserver;

    // Capture resolvedTheme at init time; the effect above keeps it current after mount.
    const initThemeValue = (resolvedTheme ?? "dark") === "light" ? 1.0 : 0.0;

    const init = async () => {
      const { Renderer, Program, Mesh, Triangle } = await import("ogl");

      const dpr = Math.min(window.devicePixelRatio, 2);
      const renderer = new Renderer({ dpr, alpha: false });
      rendererRef.current = renderer;

      const { gl } = renderer;
      container.appendChild(gl.canvas);

      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);

      const geometry = new Triangle(gl);

      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [w * dpr, h * dpr] },
          uSpeed: { value: SPEED_BASE },
          uSeed: { value: paletteSpeed(paletteRef.current) },
          uTheme: { value: initThemeValue },
          uScale: { value: scaleRef.current },
          uContrast: { value: contrastRef.current },
        },
      });

      programRef.current = program;

      const mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh;

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        renderer.setSize(newW, newH);
        program.uniforms["uResolution"] = { value: [newW * dpr, newH * dpr] };
      });
      resizeObserver.observe(container);
    };

    init();

    return () => {
      resizeObserver?.disconnect();
      const renderer_ = rendererRef.current;
      if (renderer_) {
        const ext = renderer_.gl.getExtension("WEBGL_lose_context");
        ext?.loseContext();
      }
      rendererRef.current = null;
      programRef.current = null;
      meshRef.current = null;
      const canvas = container.querySelector("canvas");
      canvas?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drive uTime each frame, scaled by the user's speed knob.
  // useAnimationFrame handles prefers-reduced-motion internally: it runs one
  // static frame synchronously then stops, so the sketch always shows a still.
  useAnimationFrame(({ t }) => {
    const prog = programRef.current;
    const renderer = rendererRef.current;
    const mesh = meshRef.current;
    if (!prog || !renderer || !mesh) return;

    prog.uniforms["uTime"] = { value: t * speedRef.current };
    renderer.render({ scene: mesh });
  });

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const speedLabelId = "shader-gradient-speed-label";
  const scaleLabelId = "shader-gradient-scale-label";
  const contrastLabelId = "shader-gradient-contrast-label";

  return (
    <PlayShell
      slug="shader-gradient"
      title="Shader Gradient"
      visualLabel="Fullscreen animated GLSL gradient"
      controls={
        <>
          {/* Color scheme select */}
          <div className="flex items-center gap-2">
            <label htmlFor="shader-gradient-palette" className="sr-only">
              Color scheme
            </label>
            <select
              id="shader-gradient-palette"
              value={palette}
              onChange={(e) => setPalette(e.target.value as PaletteLabel)}
              className={btnClass + " cursor-pointer bg-background"}
              aria-label="Color scheme"
            >
              {PALETTE_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-2">
            <span id={speedLabelId} className="text-xs text-foreground/70">
              speed
            </span>
            <input
              type="range"
              min={0}
              max={3}
              step={0.05}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={speedLabelId}
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={speed}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {speed.toFixed(2)}
            </span>
          </div>

          {/* Scale / zoom slider */}
          <div className="flex items-center gap-2">
            <span id={scaleLabelId} className="text-xs text-foreground/70">
              zoom
            </span>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={scaleLabelId}
              aria-valuemin={0.25}
              aria-valuemax={4}
              aria-valuenow={scale}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {scale.toFixed(2)}
            </span>
          </div>

          {/* Contrast slider */}
          <div className="flex items-center gap-2">
            <span id={contrastLabelId} className="text-xs text-foreground/70">
              contrast
            </span>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={contrastLabelId}
              aria-valuemin={0.5}
              aria-valuemax={3}
              aria-valuenow={contrast}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {contrast.toFixed(2)}
            </span>
          </div>
        </>
      }
      attribution={
        <>
          <span>Technique: fullscreen triangle + GLSL fragment shader via</span>{" "}
          <a
            href="https://github.com/oframe/ogl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="ogl library on GitHub (opens in new tab)"
          >
            ogl
          </a>{" "}
          <span>/ palette cosine method from</span>{" "}
          <a
            href="https://thebookofshaders.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="The Book of Shaders website (opens in new tab)"
          >
            The Book of Shaders
          </a>{" "}
          <span>by Patricio Gonzalez Vivo</span>
        </>
      }
    >
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        style={{ lineHeight: 0 }}
        role="img"
        aria-label="WebGL canvas rendering an animated color gradient driven by a fragment shader"
      />
    </PlayShell>
  );
}
