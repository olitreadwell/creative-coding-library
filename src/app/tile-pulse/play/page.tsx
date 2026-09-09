"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { clamp, TAU } from "@/lib/creative/math";
import { useAnimationFrame, type FrameInfo } from "@/lib/creative/useAnimationFrame";
import { radialFalloff, easeInOutCubic, easeOutCubic, rippleInfluence } from "../influence";

const DARK_BG = "#0d0d14";
const LIGHT_BG = "#f5f4f0";

const HOVER_RADIUS = 120;
const RIPPLE_SPEED = 340;
const RIPPLE_RING_WIDTH = 48;
const RIPPLE_LIFETIME = 2.2;
const BASE_SCALE = 0.72;
const HOVER_SCALE_BOOST = 0.52;
const RIPPLE_SCALE_BOOST = 0.44;
const DRAG_SCALE_BOOST = 0.36;

type TileShape = "circle" | "square" | "petal";
type Theme = "light" | "dark";

type Ripple = {
  x: number;
  y: number;
  age: number;
};

type Pointer = {
  x: number;
  y: number;
  down: boolean;
};

type Tile = {
  cx: number;
  cy: number;
  colorIdx: number;
  phase: number;
};

function buildGrid(
  cssW: number,
  cssH: number,
  density: number,
): { tiles: Tile[]; tileSize: number } {
  const cols = density;
  const tileSize = cssW / cols;
  const rows = Math.ceil(cssH / tileSize);
  const tiles: Tile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push({
        cx: (col + 0.5) * tileSize,
        cy: (row + 0.5) * tileSize,
        colorIdx: (col + row * 3) % 6,
        phase: ((col + row) % 8) / 8,
      });
    }
  }
  return { tiles, tileSize };
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  tileSize: number,
  scale: number,
  rotation: number,
  color: string,
  shape: TileShape,
): void {
  const halfSize = (tileSize * scale) / 2;
  ctx.save();
  ctx.translate(tile.cx, tile.cy);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();

  if (shape === "circle") {
    ctx.arc(0, 0, halfSize * 0.88, 0, TAU);
    ctx.fill();
  } else if (shape === "square") {
    const s = halfSize * 1.2;
    ctx.rect(-s, -s, s * 2, s * 2);
    ctx.fill();
  } else {
    // petal: two overlapping circles forming a lens shape
    const r = halfSize * 1.1;
    const offset = r * 0.52;
    ctx.arc(0, -offset, r, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, offset, r, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

export default function TilePulsePlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tilesRef = useRef<Tile[]>([]);
  const tileSizeRef = useRef<number>(0);
  const ripplesRef = useRef<Ripple[]>([]);
  const pointerRef = useRef<Pointer | null>(null);

  const [density, setDensity] = useState(14);
  const [speed, setSpeed] = useState(5);
  const [shape, setShape] = useState<TileShape>("circle");

  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";
  const bg = theme === "light" ? LIGHT_BG : DARK_BG;

  const densityRef = useRef(density);
  const speedRef = useRef(speed);
  const shapeRef = useRef<TileShape>(shape);
  const themeRef = useRef<Theme>(theme);

  useEffect(() => {
    densityRef.current = density;
  }, [density]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    shapeRef.current = shape;
  }, [shape]);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

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
      const { tiles, tileSize } = buildGrid(w, h, densityRef.current);
      tilesRef.current = tiles;
      tileSizeRef.current = tileSize;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Rebuild grid when density changes without a resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { tiles, tileSize } = buildGrid(canvas.clientWidth, canvas.clientHeight, density);
    tilesRef.current = tiles;
    tileSizeRef.current = tileSize;
  }, [density]);

  const pointerAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerAt(e);
    const down = (e.buttons & 1) === 1;
    // Capture previous position before overwriting the ref.
    const prev = pointerRef.current;
    pointerRef.current = { ...p, down };
    if (down && prev !== null) {
      // Drag: spawn a ripple every ~60 px of travel to stir along the path.
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 60) {
        ripplesRef.current = [...ripplesRef.current, { x: p.x, y: p.y, age: 0 }];
      }
    }
  }, []);

  const onPointerLeave = useCallback(() => {
    pointerRef.current = null;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerAt(e);
    pointerRef.current = { ...p, down: true };
    ripplesRef.current = [...ripplesRef.current, { x: p.x, y: p.y, age: 0 }];
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerAt(e);
    pointerRef.current = { ...p, down: false };
  }, []);

  useAnimationFrame(
    useCallback(({ t, dt }: FrameInfo) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const th = themeRef.current;
      const safeDt = clamp(dt, 0, 0.05);
      const spd = speedRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = th === "light" ? LIGHT_BG : DARK_BG;
      ctx.fillRect(0, 0, cssW, cssH);

      // Age and cull ripples.
      ripplesRef.current = ripplesRef.current
        .map((r) => ({ ...r, age: r.age + safeDt }))
        .filter((r) => r.age < RIPPLE_LIFETIME);

      const tiles = tilesRef.current;
      const tileSize = tileSizeRef.current;
      const pointer = pointerRef.current;
      const ripples = ripplesRef.current;
      const currentShape = shapeRef.current;

      for (const tile of tiles) {
        // Base travelling-wave: phase offset by position, looping over time.
        const basePhase = tile.phase + (t * spd) / 20;
        const wave = easeInOutCubic(((basePhase % 1) + 1) % 1);

        // Hover influence: smooth falloff within HOVER_RADIUS.
        let hoverStr = 0;
        if (pointer !== null) {
          const dx = tile.cx - pointer.x;
          const dy = tile.cy - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          hoverStr = radialFalloff(dist, HOVER_RADIUS);
        }

        // Ripple influence: sum contributions from all active ripples.
        let rippleStr = 0;
        for (const ripple of ripples) {
          const dx = tile.cx - ripple.x;
          const dy = tile.cy - ripple.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const age = ripple.age;
          const currentRadius = age * RIPPLE_SPEED;
          const fade = easeOutCubic(1 - age / RIPPLE_LIFETIME);
          rippleStr += rippleInfluence(dist, currentRadius, RIPPLE_RING_WIDTH) * fade;
        }
        rippleStr = clamp(rippleStr, 0, 1);

        const totalScale =
          BASE_SCALE +
          wave * 0.08 +
          hoverStr * HOVER_SCALE_BOOST +
          rippleStr * RIPPLE_SCALE_BOOST +
          (pointer?.down === true ? hoverStr * DRAG_SCALE_BOOST : 0);

        const rotation =
          wave * 0.18 * Math.PI + hoverStr * 0.35 * Math.PI + rippleStr * 0.22 * Math.PI;

        // Pick colour index with a slight wave drift for variety.
        const colorShift = Math.floor(wave * 2 + rippleStr * 3 + hoverStr * 2);
        const color = cbColor(tile.colorIdx + colorShift, th);

        const alpha = 0.65 + hoverStr * 0.35 + rippleStr * 0.2;
        ctx.globalAlpha = clamp(alpha, 0, 1);

        drawTile(ctx, tile, tileSize, totalScale, rotation, color, currentShape);
      }

      ctx.globalAlpha = 1;
    }, []),
    { pauseWhenHidden: true },
  );

  const labelClass = "text-xs text-foreground/70";
  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const selectClass =
    "text-sm rounded border border-border bg-background text-foreground/80 hover:text-foreground px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const densityId = "tp-density-label";
  const speedId = "tp-speed-label";
  const shapeId = "tp-shape-label";

  return (
    <PlayShell
      slug="tile-pulse"
      title="Tile Pulse"
      visualLabel="A grid of geometric tiles. Hover to disturb nearby tiles, click to send a ripple outward, or drag to stir tiles along your path."
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={densityId} className={labelClass}>
              density
            </span>
            <input
              type="range"
              min={6}
              max={28}
              step={1}
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={densityId}
              aria-valuemin={6}
              aria-valuemax={28}
              aria-valuenow={density}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">
              {density}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span id={speedId} className={labelClass}>
              speed
            </span>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby={speedId}
              aria-valuemin={1}
              aria-valuemax={12}
              aria-valuenow={speed}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">{speed}</span>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="tp-shape" id={shapeId} className={labelClass}>
              shape
            </label>
            <select
              id="tp-shape"
              value={shape}
              onChange={(e) => setShape(e.target.value as TileShape)}
              className={selectClass}
              aria-labelledby={shapeId}
            >
              <option value="circle">circle</option>
              <option value="square">square</option>
              <option value="petal">petal</option>
            </select>
          </div>
        </>
      }
      attribution={
        <>
          Hover, click, or drag the canvas. Tiles near your cursor scale and rotate; a click sends a
          ripple outward through the grid.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="A grid of geometric tiles. Hover to disturb nearby tiles, click to send a ripple outward, or drag to continuously stir tiles along your path."
        suppressHydrationWarning
        style={{ background: bg }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      />
    </PlayShell>
  );
}
