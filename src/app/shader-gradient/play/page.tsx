"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import type { Renderer as OGLRenderer, Program as OGLProgram, Mesh as OGLMesh } from "ogl";
import { vertex, fragment, paletteSpeed, type PaletteLabel } from "../shader";

const PALETTE_LABELS: PaletteLabel[] = ["calm", "warm", "wild"];

const SPEED_BASE = 0.4;

export default function ShaderGradientPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  // Tracks the active palette so the button can cycle through presets.
  const [palette, setPalette] = useState<PaletteLabel>("calm");

  // Refs expose live values to the animation loop without triggering re-renders.
  const paletteRef = useRef<PaletteLabel>("calm");
  const programRef = useRef<OGLProgram | null>(null);
  const rendererRef = useRef<OGLRenderer | null>(null);
  const meshRef = useRef<OGLMesh | null>(null);

  // Keep the ref in sync with state.
  useEffect(() => {
    paletteRef.current = palette;
    const prog = programRef.current;
    if (!prog) return;
    prog.uniforms["uSeed"] = { value: paletteSpeed(palette) };
    prog.uniforms["uSpeed"] = { value: SPEED_BASE + paletteSpeed(palette) * 0.06 };
  }, [palette]);

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

    let renderer: OGLRenderer;
    let resizeObserver: ResizeObserver;

    // Capture resolvedTheme at init time; the effect above keeps it current after mount.
    const initThemeValue = (resolvedTheme ?? "dark") === "light" ? 1.0 : 0.0;

    const init = async () => {
      const { Renderer, Program, Mesh, Triangle } = await import("ogl");

      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer = new Renderer({ dpr, alpha: false });
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
      // Remove the canvas element if it was appended.
      const canvas = container.querySelector("canvas");
      canvas?.remove();
    };
  }, []);

  // Drive uTime each frame.
  useAnimationFrame(({ t }) => {
    const prog = programRef.current;
    const renderer = rendererRef.current;
    const mesh = meshRef.current;
    if (!prog || !renderer || !mesh) return;

    prog.uniforms["uTime"] = { value: t };
    renderer.render({ scene: mesh });
  });

  const cyclePalette = () => {
    setPalette((prev) => {
      const idx = PALETTE_LABELS.indexOf(prev);
      const next = PALETTE_LABELS[(idx + 1) % PALETTE_LABELS.length];
      return next ?? "calm";
    });
  };

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="shader-gradient"
      title="Shader Gradient"
      visualLabel="Fullscreen animated GLSL gradient"
      controls={
        <button
          type="button"
          onClick={cyclePalette}
          className={btnClass}
          aria-label={`Current palette: ${palette}. Click to cycle to next palette.`}
        >
          palette: {palette}
        </button>
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
