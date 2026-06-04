"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import type MatterType from "matter-js";
import { PlayShell } from "@/components/play-shell";
import { hsl, hslString } from "@/lib/creative/color";
import { makeRng } from "@/lib/creative/random";
import { makeSpecs } from "../bodies";
import type { BodySpec } from "../bodies";

type MatterNS = typeof MatterType;

const BODY_COUNT = 120;
const WALL_THICKNESS = 60;
const GRAVITY_Y = 1.5;
const DROP_INTERVAL_MS = 35;

/** Dark stage background for dark-mode chrome. */
const STAGE_DARK = "#0d0d14";
/** Light stage background for light-mode chrome. */
const STAGE_LIGHT = "#eef0f2";

/** Wall fill color per theme. */
const WALL_DARK = "#1a1a2e";
const WALL_LIGHT = "#d4d8dd";

type SceneRefs = {
  engine: MatterType.Engine;
  render: MatterType.Render;
  runner: MatterType.Runner;
  canvas: HTMLCanvasElement;
  dropTimer: ReturnType<typeof setInterval> | null;
};

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

function specFillStyle(spec: BodySpec, isLight: boolean): string {
  // Use lower lightness on light theme so bodies contrast against the pale stage.
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

function buildBody(M: MatterNS, spec: BodySpec, yStart: number, isLight: boolean): MatterType.Body {
  const fillStyle = specFillStyle(spec, isLight);
  const strokeStyle = isLight
    ? hslString(hsl(spec.hue, 0.5, 0.22))
    : hslString(hsl(spec.hue, 0.4, 0.88));
  const commonOpts = {
    restitution: 0.3,
    friction: 0.45,
    frictionAir: 0.012,
    render: { fillStyle, strokeStyle, lineWidth: 1.5 },
  };

  if (spec.kind === "circle") {
    return M.Bodies.circle(spec.x, yStart, spec.size / 2, commonOpts);
  }
  return M.Bodies.polygon(spec.x, yStart, Math.max(3, spec.sides), spec.size / 2, commonOpts);
}

function dropBurst(
  M: MatterNS,
  scene: SceneRefs,
  specs: BodySpec[],
  isLight: boolean,
): ReturnType<typeof setInterval> {
  let i = 0;
  const timer = setInterval(() => {
    if (i >= specs.length) {
      clearInterval(timer);
      scene.dropTimer = null;
      return;
    }
    const spec = specs[i];
    if (spec) {
      M.Composite.add(scene.engine.world, buildBody(M, spec, -spec.size * 2, isLight));
    }
    i++;
  }, DROP_INTERVAL_MS);
  return timer;
}

export default function PhysicsDropsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneRefs | null>(null);
  const matterRef = useRef<MatterNS | null>(null);
  const seedRef = useRef<string>("physics-drops");
  const { resolvedTheme } = useTheme();

  /** Returns the correct stage background for the active theme. */
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
    ): void => {
      teardown();

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;
      const dpr = window.devicePixelRatio || 1;

      const engine = M.Engine.create({ gravity: { x: 0, y: GRAVITY_Y } });

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
      const specs = makeSpecs(rng, BODY_COUNT, width);

      const scene: SceneRefs = {
        engine,
        render,
        runner,
        canvas: render.canvas,
        dropTimer: null,
      };
      sceneRef.current = scene;

      scene.dropTimer = dropBurst(M, scene, specs, light);

      M.Render.run(render);
      M.Runner.run(runner, engine);
    },
    [teardown],
  );

  // Update the running render background when the theme changes without
  // reinitialising the full scene (avoids losing current body positions).
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
      // With esModuleInterop + "export = Matter", the dynamic import resolves
      // to a module whose `default` export is the Matter namespace.
      const M: MatterNS = mod.default as MatterNS;
      matterRef.current = M;
      initScene(M, container, seedRef.current, stageBackground, isLight, wallColor);
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
    // by the separate effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teardown]);

  const btnClass =
    "text-sm px-3 py-1.5 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function handleDropMore(): void {
    const M = matterRef.current;
    const s = sceneRef.current;
    const container = containerRef.current;
    if (!M || !s || !container) return;

    const width = container.clientWidth || 800;
    const rng = makeRng(randomSeed());
    const specs = makeSpecs(rng, 10, width);

    if (s.dropTimer !== null) clearInterval(s.dropTimer);
    s.dropTimer = dropBurst(M, s, specs, isLight);
  }

  function handleReset(): void {
    const M = matterRef.current;
    const container = containerRef.current;
    if (!M || !container) return;
    seedRef.current = randomSeed();
    initScene(M, container, seedRef.current, stageBackground, isLight, wallColor);
  }

  return (
    <PlayShell
      slug="physics-drops"
      title="Physics Drops"
      visualLabel="Physics simulation: colorful shapes falling and stacking under gravity"
      controls={
        <>
          <button
            type="button"
            onClick={handleDropMore}
            className={btnClass}
            aria-label="Drop more bodies into the simulation"
          >
            Drop more
          </button>
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
      />
    </PlayShell>
  );
}
