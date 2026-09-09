"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import type MatterType from "matter-js";
import { PlayShell } from "@/components/play-shell";
import { hsl, hslString } from "@/lib/creative/color";
import { makeRng } from "@/lib/creative/random";
import { usePlaying } from "@/lib/creative/motion";
import { makeSpecs } from "../bodies";
import type { BodySpec, BodyKind } from "../bodies";

type MatterNS = typeof MatterType;

// Base radius for dropped items — visibly chunky by default.
const BASE_RADIUS = 32;
const WALL_THICKNESS = 60;
const GRAVITY_Y = 1.5;
const DROP_INTERVAL_MS = 35;
const DEFAULT_RESTITUTION = 0.3;

// Fill threshold: stop spawning when accumulated body area exceeds this
// fraction of the canvas area.
const FILL_THRESHOLD = 0.6;

/** Dark stage background for dark-mode chrome. */
const STAGE_DARK = "#0d0d14";
/** Light stage background for light-mode chrome. */
const STAGE_LIGHT = "#eef0f2";

/** Wall fill color per theme. */
const WALL_DARK = "#1a1a2e";
const WALL_LIGHT = "#d4d8dd";

/** Shape filter options for the selector. */
type ShapeFilter = "mixed" | "circle" | "box";

type SceneRefs = {
  engine: MatterType.Engine;
  render: MatterType.Render;
  runner: MatterType.Runner;
  canvas: HTMLCanvasElement;
  dropTimer: ReturnType<typeof setInterval> | null;
  // Accumulated body area of all non-static bodies (px²).
  totalBodyArea: number;
};

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

function specFillStyle(spec: BodySpec, isLight: boolean): string {
  const lightness = isLight ? 0.38 : 0.6;
  return hslString(hsl(spec.hue, 0.75, lightness));
}

function buildWalls(
  M: MatterNS,
  width: number,
  height: number,
  wallColor: string,
): MatterType.Body[] {
  const opts = { isStatic: true, render: { fillStyle: wallColor } };
  return [
    M.Bodies.rectangle(
      width / 2,
      height + WALL_THICKNESS / 2,
      width + WALL_THICKNESS * 2,
      WALL_THICKNESS,
      opts,
    ),
    M.Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 2, opts),
    M.Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 2, opts),
  ];
}

/**
 * Resolve a BodySpec kind based on the active shape filter.
 * "mixed" preserves the spec's original random kind.
 * "circle" forces circles; "box" forces 4-sided polygons.
 */
function resolveKind(spec: BodySpec, filter: ShapeFilter): BodyKind {
  if (filter === "circle") return "circle";
  if (filter === "box") return "poly";
  return spec.kind;
}

/**
 * Compute the approximate cross-sectional area of a body for fill estimation.
 * Circles: π r². Polygons: approximate as regular polygon area.
 */
function bodyArea(radius: number, kind: BodyKind, sides: number): number {
  if (kind === "circle") return Math.PI * radius * radius;
  // Regular polygon: (n/2) * r² * sin(2π/n)
  const n = Math.max(3, sides);
  return (n / 2) * radius * radius * Math.sin((2 * Math.PI) / n);
}

function buildBody(
  M: MatterNS,
  spec: BodySpec,
  yStart: number,
  isLight: boolean,
  restitution: number,
  shapeFilter: ShapeFilter,
  sizeScale: number,
): MatterType.Body {
  const fillStyle = specFillStyle(spec, isLight);
  const strokeStyle = isLight
    ? hslString(hsl(spec.hue, 0.5, 0.22))
    : hslString(hsl(spec.hue, 0.4, 0.88));
  const commonOpts = {
    restitution,
    friction: 0.45,
    frictionAir: 0.012,
    render: { fillStyle, strokeStyle, lineWidth: 1.5 },
  };

  // spec.size is now used as a normalized hue/position spec; actual radius
  // comes from BASE_RADIUS * sizeScale, scaled by spec.size fraction.
  const radius = (spec.size / 2) * sizeScale;

  const kind = resolveKind(spec, shapeFilter);
  if (kind === "circle") {
    return M.Bodies.circle(spec.x, yStart, radius, commonOpts);
  }
  const sides = shapeFilter === "box" ? 4 : Math.max(3, spec.sides);
  return M.Bodies.polygon(spec.x, yStart, sides, radius, commonOpts);
}

/**
 * Start dropping bodies one at a time until either the specs array is exhausted
 * or the accumulated body area exceeds the fill threshold for the canvas.
 * Returns the interval handle so it can be cancelled.
 */
function dropBurst(
  M: MatterNS,
  scene: SceneRefs,
  specs: BodySpec[],
  isLight: boolean,
  intervalMs: number,
  restitution: number,
  shapeFilter: ShapeFilter,
  sizeScale: number,
  canvasArea: number,
): ReturnType<typeof setInterval> {
  let i = 0;
  const timer = setInterval(() => {
    if (i >= specs.length) {
      clearInterval(timer);
      scene.dropTimer = null;
      return;
    }

    // Stop spawning when container is roughly full.
    if (scene.totalBodyArea >= canvasArea * FILL_THRESHOLD) {
      clearInterval(timer);
      scene.dropTimer = null;
      return;
    }

    const spec = specs[i];
    if (spec) {
      const body = buildBody(
        M,
        spec,
        -spec.size * sizeScale * 2,
        isLight,
        restitution,
        shapeFilter,
        sizeScale,
      );
      M.Composite.add(scene.engine.world, body);

      // Accumulate area for fill detection.
      const kind = resolveKind(spec, shapeFilter);
      const sides = shapeFilter === "box" ? 4 : Math.max(3, spec.sides);
      const radius = (spec.size / 2) * sizeScale;
      scene.totalBodyArea += bodyArea(radius, kind, sides);
    }
    i++;
  }, intervalMs);
  return timer;
}

export default function PhysicsDropsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneRefs | null>(null);
  const matterRef = useRef<MatterNS | null>(null);
  const seedRef = useRef<string>(randomSeed());
  const { resolvedTheme } = useTheme();

  // Playing state from the shared motion store.
  const playing = usePlaying();
  const playingRef = useRef<boolean>(playing);

  // Interactive control state — defaults match original behaviour.
  const [gravityY, setGravityY] = useState<number>(GRAVITY_Y);
  const [dropIntervalMs, setDropIntervalMs] = useState<number>(DROP_INTERVAL_MS);
  const [restitution, setRestitution] = useState<number>(DEFAULT_RESTITUTION);
  const [shapeFilter, setShapeFilter] = useState<ShapeFilter>("mixed");
  // sizeScale: 0.5 = half, 1.0 = default BASE_RADIUS, 2.0 = double.
  const [sizeScale, setSizeScale] = useState<number>(1.0);

  // Refs so callbacks always see current values without stale closures.
  const restitutionRef = useRef<number>(DEFAULT_RESTITUTION);
  const shapeFilterRef = useRef<ShapeFilter>("mixed");
  const dropIntervalMsRef = useRef<number>(DROP_INTERVAL_MS);
  const sizeScaleRef = useRef<number>(1.0);

  const isLight = resolvedTheme === "light";
  const stageBackground = isLight ? STAGE_LIGHT : STAGE_DARK;
  const wallColor = isLight ? WALL_LIGHT : WALL_DARK;

  const teardown = useCallback((): void => {
    const s = sceneRef.current;
    sceneRef.current = null;
    if (!s) return;

    if (s.dropTimer !== null) clearInterval(s.dropTimer);

    const M = matterRef.current;
    try {
      M?.Render.stop(s.render);
    } catch {
      /* noop */
    }
    try {
      M?.Runner.stop(s.runner);
    } catch {
      /* noop */
    }
    try {
      M?.World.clear(s.engine.world, false);
    } catch {
      /* noop */
    }
    try {
      M?.Engine.clear(s.engine);
    } catch {
      /* noop */
    }

    if (s.canvas.parentNode) s.canvas.parentNode.removeChild(s.canvas);
  }, []);

  const initScene = useCallback(
    (
      M: MatterNS,
      container: HTMLDivElement,
      seed: string,
      background: string,
      light: boolean,
      wColor: string,
      gravity: number,
      intervalMs: number,
      rest: number,
      shape: ShapeFilter,
      scale: number,
      isPlaying: boolean,
    ): void => {
      teardown();

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;
      const dpr = window.devicePixelRatio || 1;

      const engine = M.Engine.create({ gravity: { x: 0, y: gravity } });

      const render = M.Render.create({
        element: container,
        engine,
        options: {
          width,
          height,
          pixelRatio: dpr,
          background,
          wireframes: false,
        },
      });

      const runner = M.Runner.create();

      M.Composite.add(engine.world, buildWalls(M, width, height, wColor));

      const rng = makeRng(seed);
      // Generate enough specs to fill the canvas — derive count from area.
      // Each body occupies roughly π*(BASE_RADIUS*scale)² area on average.
      const avgBodyArea = Math.PI * Math.pow(BASE_RADIUS * scale, 2);
      const canvasArea = width * height;
      const estimatedCount = Math.ceil((canvasArea * FILL_THRESHOLD) / avgBodyArea) + 20;
      const specs = makeSpecs(rng, estimatedCount, width);

      const scene: SceneRefs = {
        engine,
        render,
        runner,
        canvas: render.canvas,
        dropTimer: null,
        totalBodyArea: 0,
      };
      sceneRef.current = scene;

      M.Render.run(render);

      if (isPlaying) {
        scene.dropTimer = dropBurst(
          M,
          scene,
          specs,
          light,
          intervalMs,
          rest,
          shape,
          scale,
          canvasArea,
        );
        M.Runner.run(runner, engine);
      }
    },
    [teardown],
  );

  // Gate the runner on the playing state from the motion store.
  useEffect(() => {
    playingRef.current = playing;
    const s = sceneRef.current;
    const M = matterRef.current;
    if (!s || !M) return;

    if (playing) {
      M.Runner.run(s.runner, s.engine);
    } else {
      M.Runner.stop(s.runner);
      // Also halt any ongoing drop timer so bodies don't spawn while paused.
      if (s.dropTimer !== null) {
        clearInterval(s.dropTimer);
        s.dropTimer = null;
      }
    }
  }, [playing]);

  // Apply live gravity changes directly to the running engine.
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    s.engine.gravity.y = gravityY;
  }, [gravityY]);

  // Update the running render background when the theme changes without
  // reinitialising the full scene.
  useEffect(() => {
    const s = sceneRef.current;
    if (!s || resolvedTheme === undefined) return;
    s.render.options.background = stageBackground;
  }, [resolvedTheme, stageBackground]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    import("matter-js").then((mod) => {
      if (cancelled) return;
      const M: MatterNS = mod.default as MatterNS;
      matterRef.current = M;
      initScene(
        M,
        container,
        seedRef.current,
        stageBackground,
        isLight,
        wallColor,
        gravityY,
        dropIntervalMs,
        restitution,
        shapeFilter,
        sizeScaleRef.current,
        playingRef.current,
      );
    });

    const ro = new ResizeObserver(() => {
      const c = containerRef.current;
      const s = sceneRef.current;
      if (!c || !s) return;
      const w = c.clientWidth || 800;
      const h = c.clientHeight || 600;
      const dpr = window.devicePixelRatio || 1;
      s.render.options.width = w;
      s.render.options.height = h;
      s.render.canvas.width = w * dpr;
      s.render.canvas.height = h * dpr;
      matterRef.current?.Render.lookAt(s.render, {
        min: { x: 0, y: 0 },
        max: { x: w, y: h },
      });
    });
    ro.observe(container);

    return () => {
      cancelled = true;
      ro.disconnect();
      teardown();
    };
    // initScene, stageBackground, isLight, and wallColor intentionally omitted:
    // we only want this effect to run once on mount. Theme changes are handled
    // by the separate effect above. Control param changes are applied live or
    // take effect on the next Reset action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teardown]);

  const btnClass =
    "text-sm px-3 py-1.5 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function handleReset(): void {
    const M = matterRef.current;
    const container = containerRef.current;
    if (!M || !container) return;
    seedRef.current = randomSeed();
    initScene(
      M,
      container,
      seedRef.current,
      stageBackground,
      isLight,
      wallColor,
      gravityY,
      dropIntervalMsRef.current,
      restitutionRef.current,
      shapeFilterRef.current,
      sizeScaleRef.current,
      playingRef.current,
    );
  }

  function handleGravity(e: React.ChangeEvent<HTMLInputElement>): void {
    setGravityY(Number(e.target.value));
  }

  function handleDropRate(e: React.ChangeEvent<HTMLInputElement>): void {
    const bps = Number(e.target.value);
    const ms = Math.round(1000 / bps);
    setDropIntervalMs(ms);
    dropIntervalMsRef.current = ms;
  }

  function handleRestitution(e: React.ChangeEvent<HTMLInputElement>): void {
    const v = Number(e.target.value);
    setRestitution(v);
    restitutionRef.current = v;
  }

  function handleShape(e: React.ChangeEvent<HTMLSelectElement>): void {
    const v = e.target.value as ShapeFilter;
    setShapeFilter(v);
    shapeFilterRef.current = v;
  }

  function handleSizeScale(e: React.ChangeEvent<HTMLInputElement>): void {
    const v = Number(e.target.value);
    setSizeScale(v);
    sizeScaleRef.current = v;
  }

  const bpsDisplay = Math.round(1000 / dropIntervalMs);

  const gravityLabelId = "gravity-label";
  const dropRateLabelId = "drop-rate-label";
  const restitutionLabelId = "restitution-label";
  const sizeLabelId = "size-label";

  return (
    <PlayShell
      slug="physics-drops"
      title="Physics Drops"
      visualLabel="Physics simulation: colorful shapes falling and stacking under gravity"
      controls={
        <>
          {/* Gravity slider */}
          <div className="flex items-center gap-2">
            <span id={gravityLabelId} className="text-xs text-foreground/70">
              gravity
            </span>
            <input
              type="range"
              min={0}
              max={3}
              step={0.05}
              value={gravityY}
              onChange={handleGravity}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={gravityLabelId}
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={gravityY}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {gravityY.toFixed(1)}
            </span>
          </div>

          {/* Drop rate slider */}
          <div className="flex items-center gap-2">
            <span id={dropRateLabelId} className="text-xs text-foreground/70">
              rate
            </span>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={bpsDisplay}
              onChange={handleDropRate}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={dropRateLabelId}
              aria-valuemin={1}
              aria-valuemax={30}
              aria-valuenow={bpsDisplay}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {bpsDisplay}/s
            </span>
          </div>

          {/* Bounciness slider */}
          <div className="flex items-center gap-2">
            <span id={restitutionLabelId} className="text-xs text-foreground/70">
              bounce
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={restitution}
              onChange={handleRestitution}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={restitutionLabelId}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={restitution}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {restitution.toFixed(2)}
            </span>
          </div>

          {/* Size slider */}
          <div className="flex items-center gap-2">
            <span id={sizeLabelId} className="text-xs text-foreground/70">
              size
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={sizeScale}
              onChange={handleSizeScale}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={sizeLabelId}
              aria-valuemin={0.5}
              aria-valuemax={2}
              aria-valuenow={sizeScale}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {sizeScale.toFixed(2)}
            </span>
          </div>

          {/* Shape selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="shape-filter" className="text-xs text-foreground/70">
              shape
            </label>
            <select
              id="shape-filter"
              value={shapeFilter}
              onChange={handleShape}
              className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground/70 hover:border-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="mixed">mixed</option>
              <option value="circle">circle</option>
              <option value="box">box</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className={btnClass}
            aria-label="Reset simulation with a new random seed"
          >
            Reset
          </button>
        </>
      }
      attribution={
        <>
          Technique: matter.js rigid-body simulation with built-in Render.{" "}
          <a
            href="https://brm.io/matter-js/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            matter.js
          </a>{" "}
          by Liam Brummitt (MIT).
        </>
      }
    >
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Physics simulation: colorful shapes falling and stacking under gravity"
        role="img"
        suppressHydrationWarning
      />
    </PlayShell>
  );
}
