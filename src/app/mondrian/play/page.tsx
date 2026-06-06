"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColors } from "@/lib/creative/cbpalette";
import { makeRng, type Rng } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { subdivide, type Rect } from "../subdivide";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DARK_BG = "#111111";
const LIGHT_BG = "#f5f3ee";

// Perspective focal length in CSS pixels. Panels at z=0 render at 1:1 scale.
const FOCAL = 600;

// The z-range panels live in. New panels spawn at Z_FAR and travel to Z_NEAR.
// When z passes Z_NEAR the panel is recycled to Z_FAR.
const Z_NEAR = -FOCAL * 0.9; // just past the camera
const Z_FAR = 2000;

// Number of depth-layers (parallel panel sets in the z-axis tunnel).
const DEFAULT_LAYER_COUNT = 8;

// Default fall speed: z-units per second.
const DEFAULT_FALL_SPEED = 350;

// Subdivision depth for each panel layer.
const DEFAULT_SUBDIVISION_DEPTH = 4;

// Focus depth: the z value considered "in focus" for the DoF effect.
const DEFAULT_FOCUS_DEPTH = 600;

// Half-depth-of-field range (in z-units). Panels within this range of the
// focus depth render at full opacity; beyond it they fade.
const DOF_HALF_RANGE = 800;

const DEFAULT_LINE_WEIGHT = 4;

const LABEL_SPEED = "mondrian-speed-label";
const LABEL_LAYERS = "mondrian-layers-label";
const LABEL_DEPTH = "mondrian-depth-label";
const LABEL_FOCUS = "mondrian-focus-label";
const LABEL_WEIGHT = "mondrian-weight-label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Theme = "light" | "dark";

interface Layer {
  /** Current z distance from the camera (positive = further away). */
  z: number;
  /** Subdivided rects in a normalised [0,1]×[0,1] coordinate space. */
  rects: Rect[];
  /** Fill color per rect index. */
  fills: string[];
  /** Seed used so the layer can be reproduced deterministically. */
  seed: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/**
 * Builds a fresh layer at the given z with a random subdivision.
 * Rects are normalised to [0,1]×[0,1] so they can be scaled to any viewport.
 */
function makeLayer(z: number, seed: number, subdivisionDepth: number, theme: Theme): Layer {
  const rng: Rng = makeRng(seed);
  const unit: Rect = { x: 0, y: 0, w: 1, h: 1 };
  const rects = subdivide(unit, subdivisionDepth, rng);

  const palette = cbColors(theme);
  const colorRng: Rng = makeRng(seed + 1);
  const fills = rects.map(() => {
    if (colorRng() < 0.35) {
      const idx = Math.floor(colorRng() * palette.length);
      return palette[idx] ?? (theme === "light" ? "#f0ede5" : "#1a1a1a");
    }
    return theme === "light" ? "#f0ede5" : "#1a1a1a";
  });

  return { z, rects, fills, seed };
}

/**
 * Returns the CSS-pixel scale factor for a panel at depth `z`.
 * Uses classic perspective: scale = focal / (focal + z).
 */
function perspectiveScale(z: number): number {
  const denom = FOCAL + z;
  if (denom <= 0) return 10; // clamp if panel overshoots focal point
  return FOCAL / denom;
}

/**
 * Maps a z value to an alpha [0, 1] for the depth-of-field effect.
 * Panels near `focusDepth` are fully opaque; panels far from it fade.
 */
function dofAlpha(z: number, focusDepth: number): number {
  const dist = Math.abs(z - focusDepth);
  const alpha = 1 - Math.min(1, dist / DOF_HALF_RANGE);
  // Keep a minimum alpha so the farthest panels are still barely visible.
  return 0.1 + alpha * 0.9;
}

// ---------------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------------

function drawFrame(
  canvas: HTMLCanvasElement,
  layers: Layer[],
  lineWeight: number,
  focusDepth: number,
  theme: Theme,
): void {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;

  if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const bg = theme === "light" ? LIGHT_BG : DARK_BG;
  const strokeColor = theme === "light" ? "#111111" : "#eeeeee";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  // Sort layers back-to-front so near panels overdraw far ones correctly.
  const sorted = [...layers].sort((a, b) => b.z - a.z);

  const cx = cssW / 2;
  const cy = cssH / 2;

  for (const layer of sorted) {
    const scale = perspectiveScale(layer.z);
    const alpha = dofAlpha(layer.z, focusDepth);

    // Panel viewport in CSS px: centered, scaled by perspective.
    const panelW = cssW * scale;
    const panelH = cssH * scale;
    const panelX = cx - panelW / 2;
    const panelY = cy - panelH / 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Fill pass.
    for (let i = 0; i < layer.rects.length; i++) {
      const r = layer.rects[i];
      if (!r) continue;
      ctx.fillStyle = layer.fills[i] ?? (theme === "light" ? "#f0ede5" : "#1a1a1a");
      ctx.fillRect(panelX + r.x * panelW, panelY + r.y * panelH, r.w * panelW, r.h * panelH);
    }

    // Stroke pass — scale line weight with perspective for near panels.
    const scaledWeight = Math.max(0.5, lineWeight * scale);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = scaledWeight;
    ctx.lineJoin = "miter";

    for (const r of layer.rects) {
      ctx.strokeRect(panelX + r.x * panelW, panelY + r.y * panelH, r.w * panelW, r.h * panelH);
    }

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MondrianPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "dark") as Theme;

  const [fallSpeed, setFallSpeed] = useState<number>(DEFAULT_FALL_SPEED);
  const [layerCount, setLayerCount] = useState<number>(DEFAULT_LAYER_COUNT);
  const [subdivisionDepth, setSubdivisionDepth] = useState<number>(DEFAULT_SUBDIVISION_DEPTH);
  const [focusDepth, setFocusDepth] = useState<number>(DEFAULT_FOCUS_DEPTH);
  const [lineWeight, setLineWeight] = useState<number>(DEFAULT_LINE_WEIGHT);

  // Layers live in a ref so animation frame reads the latest values without
  // needing to be a React dep. The state value is only used to force a rebuild.
  const layersRef = useRef<Layer[]>([]);
  const [baseSeed, setBaseSeed] = useState<number>(() => randomSeed());

  // Rebuild layers when structural params change (seed, count, depth, theme).
  useEffect(() => {
    const spacing = (Z_FAR - 0) / layerCount;
    const layers: Layer[] = [];
    const seedRng = makeRng(baseSeed);
    for (let i = 0; i < layerCount; i++) {
      const z = i * spacing;
      const seed = Math.floor(seedRng() * 2 ** 31);
      layers.push(makeLayer(z, seed, subdivisionDepth, theme));
    }
    layersRef.current = layers;
  }, [baseSeed, layerCount, subdivisionDepth, theme]);

  // Keep a stable ref to params the animation loop reads each frame.
  const paramsRef = useRef({ fallSpeed, focusDepth, lineWeight, theme });
  useEffect(() => {
    paramsRef.current = { fallSpeed, focusDepth, lineWeight, theme };
  }, [fallSpeed, focusDepth, lineWeight, theme]);

  const seedRngRef = useRef<Rng>(makeRng(baseSeed + 99));
  useEffect(() => {
    seedRngRef.current = makeRng(baseSeed + 99);
  }, [baseSeed]);

  useAnimationFrame(
    useCallback(
      ({ dt }: { dt: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const {
          fallSpeed: speed,
          focusDepth: focus,
          lineWeight: lw,
          theme: th,
        } = paramsRef.current;
        const layers = layersRef.current;
        const depth = subdivisionDepth;

        // Advance each layer toward the camera (decrease z).
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          if (!layer) continue;
          layer.z -= speed * dt;

          // Recycle: when a layer passes Z_NEAR, teleport it to Z_FAR with a
          // fresh random subdivision so the tunnel never runs dry.
          if (layer.z < Z_NEAR) {
            const newSeed = Math.floor(seedRngRef.current() * 2 ** 31);
            const recycled = makeLayer(Z_FAR, newSeed, depth, th);
            layers[i] = recycled;
          }
        }

        drawFrame(canvas, layers, lw, focus, th);
      },
      // subdivisionDepth is the only structural param that the loop needs as a
      // captured value (used inside makeLayer on recycle). The rest come from
      // paramsRef so they don't retrigger the hook.
      [subdivisionDepth],
    ),
    { pauseWhenHidden: true },
  );

  // Resize handler: redraw on size change without waiting for the next frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const { focusDepth: focus, lineWeight: lw, theme: th } = paramsRef.current;
      drawFrame(canvas, layersRef.current, lw, focus, th);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  function handleRegenerate(): void {
    setBaseSeed(randomSeed());
  }

  function handlePointerDown(): void {
    setBaseSeed(randomSeed());
  }

  const bg = theme === "light" ? LIGHT_BG : DARK_BG;

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50" +
    " text-foreground/70 hover:text-foreground transition-colors" +
    " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const labelClass = "text-xs text-foreground/70";

  const valueLabelClass = "w-10 text-right text-xs text-foreground/70 tabular-nums";

  return (
    <PlayShell
      slug="mondrian"
      title="Mondrian"
      visualLabel="Animated 3D falling Mondrian panels. De Stijl grids at different depths rush toward the viewer, creating a depth-of-field tunnel effect. Click the canvas to regenerate."
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={LABEL_SPEED} className={labelClass}>
              speed
            </span>
            <input
              type="range"
              min={50}
              max={1200}
              step={50}
              value={fallSpeed}
              onChange={(e) => setFallSpeed(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={LABEL_SPEED}
              aria-valuemin={50}
              aria-valuemax={1200}
              aria-valuenow={fallSpeed}
            />
            <span className={valueLabelClass}>{fallSpeed}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={LABEL_LAYERS} className={labelClass}>
              layers
            </span>
            <input
              type="range"
              min={3}
              max={16}
              step={1}
              value={layerCount}
              onChange={(e) => setLayerCount(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={LABEL_LAYERS}
              aria-valuemin={3}
              aria-valuemax={16}
              aria-valuenow={layerCount}
            />
            <span className={valueLabelClass}>{layerCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={LABEL_DEPTH} className={labelClass}>
              density
            </span>
            <input
              type="range"
              min={2}
              max={7}
              step={1}
              value={subdivisionDepth}
              onChange={(e) => setSubdivisionDepth(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={LABEL_DEPTH}
              aria-valuemin={2}
              aria-valuemax={7}
              aria-valuenow={subdivisionDepth}
            />
            <span className={valueLabelClass}>{subdivisionDepth}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={LABEL_FOCUS} className={labelClass}>
              focus
            </span>
            <input
              type="range"
              min={0}
              max={Z_FAR}
              step={50}
              value={focusDepth}
              onChange={(e) => setFocusDepth(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={LABEL_FOCUS}
              aria-valuemin={0}
              aria-valuemax={Z_FAR}
              aria-valuenow={focusDepth}
            />
            <span className={valueLabelClass}>{focusDepth}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id={LABEL_WEIGHT} className={labelClass}>
              line weight
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={lineWeight}
              onChange={(e) => setLineWeight(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={LABEL_WEIGHT}
              aria-valuemin={1}
              aria-valuemax={20}
              aria-valuenow={lineWeight}
            />
            <span className={valueLabelClass}>{lineWeight}px</span>
          </div>
          <button
            type="button"
            onClick={handleRegenerate}
            className={btnClass}
            aria-label="Regenerate the composition with a new random layout"
          >
            Regenerate
          </button>
        </>
      }
      attribution="Recursive rectangle subdivision, De Stijl / Mondrian style. Original concept by Piet Mondrian."
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-pointer"
        aria-label="Animated falling Mondrian panels. Click anywhere to generate a fresh set of layers."
        suppressHydrationWarning
        style={{ background: bg }}
        onPointerDown={handlePointerDown}
      />
    </PlayShell>
  );
}
