"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type MatterType from "matter-js";
import { hsl, hslString } from "@/lib/creative/color";
import { makeRng } from "@/lib/creative/random";
import { makeSpecs } from "./bodies";
import type { BodySpec } from "./bodies";

type MatterNS = typeof MatterType;

const BODY_COUNT = 120;
const WALL_THICKNESS = 60;
const GRAVITY_Y = 1.5;
const DROP_INTERVAL_MS = 35;
const BACKGROUND = "#0d0d14";

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

function specFillStyle(spec: BodySpec): string {
  return hslString(hsl(spec.hue, 0.75, 0.6));
}

function buildWalls(M: MatterNS, width: number, height: number): MatterType.Body[] {
  const opts = { isStatic: true, render: { fillStyle: "#1a1a2e" } };
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

function buildBody(M: MatterNS, spec: BodySpec, yStart: number): MatterType.Body {
  const fillStyle = specFillStyle(spec);
  const strokeStyle = hslString(hsl(spec.hue, 0.4, 0.88));
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
      M.Composite.add(scene.engine.world, buildBody(M, spec, -spec.size * 2));
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
    (M: MatterNS, container: HTMLDivElement, seed: string): void => {
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
          background: BACKGROUND,
          wireframes: false,
        },
      });

      const runner = M.Runner.create();

      M.Composite.add(engine.world, buildWalls(M, width, height));

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

      scene.dropTimer = dropBurst(M, scene, specs);

      M.Render.run(render);
      M.Runner.run(runner, engine);
    },
    [teardown],
  );

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
      initScene(M, container, seedRef.current);
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
  }, [initScene, teardown]);

  function handleDropMore(): void {
    const M = matterRef.current;
    const s = sceneRef.current;
    const container = containerRef.current;
    if (!M || !s || !container) return;

    const width = container.clientWidth || 800;
    const rng = makeRng(randomSeed());
    const specs = makeSpecs(rng, 10, width);

    if (s.dropTimer !== null) clearInterval(s.dropTimer);
    s.dropTimer = dropBurst(M, s, specs);
  }

  function handleReset(): void {
    const M = matterRef.current;
    const container = containerRef.current;
    if (!M || !container) return;
    seedRef.current = randomSeed();
    initScene(M, container, seedRef.current);
  }

  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white underline underline-offset-2"
          >
            &larr; home
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide text-white/80">Physics Drops</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDropMore}
            className="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/50 text-white/70 hover:text-white transition-colors"
            aria-label="Drop more bodies into the scene"
          >
            Drop more
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/50 text-white/70 hover:text-white transition-colors"
            aria-label="Reset simulation with a new seed"
          >
            Reset
          </button>
        </div>
      </header>

      <section
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        aria-label="Physics simulation: colorful bodies falling and stacking under gravity"
      />

      <footer className="px-6 py-4 text-xs text-white/30 border-t border-white/10">
        Technique: matter.js rigid-body simulation with built-in Render.{" "}
        <a
          href="https://brm.io/matter-js/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-white/60"
        >
          matter.js
        </a>{" "}
        by Liam Brummitt (MIT).
      </footer>
    </main>
  );
}
