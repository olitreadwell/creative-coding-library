"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
import { makeRng, randRange } from "@/lib/creative/random";
import { useAnimationFrame } from "@/lib/creative/useAnimationFrame";
import { nearestSiteIndex } from "../voronoi";
import type { Site } from "../voronoi";

/** Size of each downsampled grid cell in CSS pixels. */
const CELL_SIZE = 6;

/** Radius of the dot drawn over each site. */
const SITE_RADIUS = 5;

const MIN_SITE_COUNT = 2;
const MAX_SITE_COUNT = 40;
const DEFAULT_SITE_COUNT = 12;

const MIN_SPEED = 0.2;
const MAX_SPEED_SLIDER = 3;
const DEFAULT_SPEED = 1;

type MovingSite = Site & { vx: number; vy: number };

/** Generates a numeric seed from the current timestamp. */
function freshSeed(): number {
  return Date.now() & 0xffffffff;
}

/**
 * Creates an array of sites with random positions and velocities.
 *
 * @param count - Number of sites to create.
 * @param width - Canvas width in CSS pixels.
 * @param height - Canvas height in CSS pixels.
 * @param speedScale - Multiplier applied to base velocity.
 * @param seed - Seed for the PRNG.
 */
function makeSites(
  count: number,
  width: number,
  height: number,
  speedScale: number,
  seed: number,
): MovingSite[] {
  const rng = makeRng(seed);
  const sites: MovingSite[] = [];
  for (let i = 0; i < count; i++) {
    const angle = randRange(rng, 0, Math.PI * 2);
    const speed = randRange(rng, MIN_SPEED, MIN_SPEED + speedScale);
    sites.push({
      x: randRange(rng, 0, width),
      y: randRange(rng, 0, height),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return sites;
}

/**
 * Advances all sites by one tick, bouncing off canvas edges.
 *
 * Mutates the array in place for performance (the canvas draw loop
 * always reads the ref, so we don't need React state updates per frame).
 */
function stepSites(sites: MovingSite[], width: number, height: number): void {
  for (const s of sites) {
    s.x += s.vx;
    s.y += s.vy;

    if (s.x < 0) {
      s.x = 0;
      s.vx = Math.abs(s.vx);
    } else if (s.x > width) {
      s.x = width;
      s.vx = -Math.abs(s.vx);
    }

    if (s.y < 0) {
      s.y = 0;
      s.vy = Math.abs(s.vy);
    } else if (s.y > height) {
      s.y = height;
      s.vy = -Math.abs(s.vy);
    }
  }
}

/**
 * Paints the Voronoi diagram onto `ctx` using a downsampled grid.
 *
 * Each CELL_SIZE x CELL_SIZE block is colored by its nearest site.
 * Site dots are drawn on top, and cell borders are drawn where
 * adjacent grid cells have different owners.
 */
function drawVoronoi(
  ctx: CanvasRenderingContext2D,
  sites: readonly MovingSite[],
  cssW: number,
  cssH: number,
  theme: "light" | "dark",
): void {
  if (sites.length === 0) return;

  const cols = Math.ceil(cssW / CELL_SIZE);
  const rows = Math.ceil(cssH / CELL_SIZE);

  // Build owner grid: which site owns each cell.
  const owners = new Int16Array(cols * rows);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * CELL_SIZE + CELL_SIZE / 2;
      const cy = row * CELL_SIZE + CELL_SIZE / 2;
      owners[row * cols + col] = nearestSiteIndex(cx, cy, sites);
    }
  }

  // Draw filled cells.
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const owner = owners[row * cols + col] ?? 0;
      ctx.fillStyle = cbColor(owner, theme);
      ctx.globalAlpha = 0.55;
      ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  // Draw cell borders where adjacent cells have different owners.
  const borderColor = theme === "dark" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)";
  ctx.globalAlpha = 1;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const me = owners[row * cols + col] ?? 0;
      // Check right neighbour.
      if (col + 1 < cols && owners[row * cols + col + 1] !== me) {
        ctx.beginPath();
        ctx.moveTo((col + 1) * CELL_SIZE, row * CELL_SIZE);
        ctx.lineTo((col + 1) * CELL_SIZE, (row + 1) * CELL_SIZE);
        ctx.stroke();
      }
      // Check bottom neighbour.
      if (row + 1 < rows && owners[(row + 1) * cols + col] !== me) {
        ctx.beginPath();
        ctx.moveTo(col * CELL_SIZE, (row + 1) * CELL_SIZE);
        ctx.lineTo((col + 1) * CELL_SIZE, (row + 1) * CELL_SIZE);
        ctx.stroke();
      }
    }
  }

  // Draw site dots on top.
  ctx.globalAlpha = 1;
  for (let i = 0; i < sites.length; i++) {
    const s = sites[i];
    if (!s) continue;
    ctx.beginPath();
    ctx.arc(s.x, s.y, SITE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = cbColor(i, theme);
    ctx.fill();
    // White/black halo for contrast against any cell color.
    ctx.strokeStyle = theme === "dark" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export default function VoronoiPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sitesRef = useRef<MovingSite[]>([]);
  const themeRef = useRef<"light" | "dark">("dark");
  const sizeRef = useRef<{ w: number; h: number } | null>(null);

  const [seed, setSeed] = useState<number>(() => freshSeed());
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [siteCount, setSiteCount] = useState<number>(DEFAULT_SITE_COUNT);
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEED);

  // Keep refs in sync so the animation loop reads the latest values without
  // re-subscribing.
  const speedRef = useRef<number>(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "light" ? "light" : "dark";
  const canvasBg = theme === "dark" ? "#111111" : "#f5f5f5";

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Initialize sites when seed, count, or canvas size changes.
  useEffect(() => {
    if (!size) return;
    sitesRef.current = makeSites(siteCount, size.w, size.h, speed, seed);
  }, [seed, siteCount, size, speed]);

  // Fit canvas to CSS box, DPR-aware, with ResizeObserver.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      const dpr = window.devicePixelRatio ?? 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const next = { w: cssW, h: cssH };
      sizeRef.current = next;
      setSize(next);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Animation loop: step sites then draw.
  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    const currentSize = sizeRef.current;
    if (!canvas || !currentSize) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Step sites using the latest speed from the ref (avoids loop re-subscribe).
    stepSites(sitesRef.current, currentSize.w, currentSize.h);

    const dpr = window.devicePixelRatio ?? 1;
    ctx.resetTransform();
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw in CSS-pixel space.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawVoronoi(ctx, sitesRef.current, currentSize.w, currentSize.h, themeRef.current);
  });

  // Add a new site at the pointer position.
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const rng = makeRng(Date.now());
    const angle = randRange(rng, 0, Math.PI * 2);
    const spd = randRange(rng, MIN_SPEED, MIN_SPEED + speedRef.current);

    sitesRef.current = [
      ...sitesRef.current,
      { x: cx, y: cy, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd },
    ];
  }, []);

  const handleReset = useCallback(() => {
    setSeed(freshSeed());
  }, []);

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const labelClass = "text-xs text-foreground/70 w-16 shrink-0";
  const valueClass = "w-8 text-right text-xs text-foreground/70 tabular-nums";
  const sliderClass =
    "w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PlayShell
      slug="voronoi"
      title="Voronoi"
      visualLabel="Animated Voronoi diagram with moving colored cells. Click to add a new site."
      attribution={<>Voronoi nearest-neighbor partition. MIT licensed.</>}
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id="voronoi-sites-label" className={labelClass}>
              sites
            </span>
            <input
              type="range"
              min={MIN_SITE_COUNT}
              max={MAX_SITE_COUNT}
              step={1}
              value={siteCount}
              onChange={(e) => setSiteCount(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="voronoi-sites-label"
              aria-valuemin={MIN_SITE_COUNT}
              aria-valuemax={MAX_SITE_COUNT}
              aria-valuenow={siteCount}
            />
            <span className={valueClass}>{siteCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span id="voronoi-speed-label" className={labelClass}>
              speed
            </span>
            <input
              type="range"
              min={0.1}
              max={MAX_SPEED_SLIDER}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className={sliderClass}
              aria-labelledby="voronoi-speed-label"
              aria-valuemin={0.1}
              aria-valuemax={MAX_SPEED_SLIDER}
              aria-valuenow={speed}
            />
            <span className={valueClass}>{speed.toFixed(1)}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className={btnClass}
            aria-label="Reset sites with a new random arrangement"
          >
            Reset
          </button>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        suppressHydrationWarning
        style={{ background: canvasBg }}
        aria-label="Animated Voronoi diagram. The canvas is split into colored cells, each belonging to its nearest moving site. Click anywhere to add a new site."
        onPointerDown={handlePointerDown}
      />
    </PlayShell>
  );
}
