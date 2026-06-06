"use client";

import { useLayoutEffect, useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { gsap } from "gsap";
import { PlayShell } from "@/components/play-shell";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { usePlaying } from "@/lib/creative/motion";
import { gridCells, centerDistance } from "../grid";

// Map a cell's distance from center to a hue so outer tiles shift in color.
function cellHue(row: number, col: number, cols: number, rows: number): number {
  const maxDist = centerDistance(0, 0, cols, rows);
  const d = centerDistance(row, col, cols, rows);
  return map(d, 0, maxDist, 200, 310);
}

// Tile lightness and saturation vary by theme so tiles stay distinct against
// the page background in both light and dark modes.
function tileColor(hue: number, resolvedTheme: string): string {
  const isDark = resolvedTheme !== "light";
  const saturation = isDark ? 0.72 : 0.8;
  const lightness = isDark ? 0.58 : 0.42;
  return hslString(hsl(hue, saturation, lightness));
}

type StaggerFrom = "start" | "center" | "edges" | "end";

const EASE_OPTIONS = [
  "sine.inOut",
  "power1.out",
  "power2.inOut",
  "power3.out",
  "back.out(1.7)",
  "elastic.out(1, 0.3)",
  "none",
] as const;
type EaseOption = (typeof EASE_OPTIONS)[number];

const FROM_OPTIONS: StaggerFrom[] = ["center", "start", "edges", "end"];

const DEFAULT_STAGGER = 0.045;
const DEFAULT_COLS = 12;
const DEFAULT_ROWS = 8;
const DEFAULT_EASE: EaseOption = "sine.inOut";
const DEFAULT_FROM: StaggerFrom = "center";

const btnClass =
  "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const selectClass =
  "text-sm rounded border border-border bg-background text-foreground/70 hover:text-foreground px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function StaggerGridPage() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme ?? "dark";

  const playing = usePlaying();

  const [stagger, setStagger] = useState<number>(DEFAULT_STAGGER);
  const [cols, setCols] = useState<number>(DEFAULT_COLS);
  const [ease, setEase] = useState<EaseOption>(DEFAULT_EASE);
  const [from, setFrom] = useState<StaggerFrom>(DEFAULT_FROM);

  // Actual container dimensions tracked via ResizeObserver.
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Rows derived from the real container aspect ratio so tiles fill edge-to-edge.
  const rows =
    containerSize.width > 0 && containerSize.height > 0
      ? Math.max(1, Math.round((cols * containerSize.height) / containerSize.width))
      : Math.max(1, Math.round((cols * DEFAULT_ROWS) / DEFAULT_COLS));

  const cells = gridCells(cols, rows);

  // Observe the scope element so rows updates whenever the play area resizes.
  useEffect(() => {
    const el = scopeRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const buildTimeline = useCallback(
    (
      ctx: gsap.Context,
      currentStagger: number,
      currentEase: string,
      currentFrom: StaggerFrom,
      currentCols: number,
      currentRows: number,
      startPlaying: boolean,
    ) => {
      ctx.add(() => {
        gsap.set(".stagger-tile", { scale: 1, opacity: 1, rotation: 0 });

        const tl = gsap.timeline({
          repeat: -1,
          yoyo: true,
          repeatDelay: 0.4,
          paused: !startPlaying,
        });
        tl.to(".stagger-tile", {
          scale: 0.45,
          rotation: 180,
          duration: 1.2,
          ease: currentEase,
          stagger: {
            each: currentStagger,
            from: currentFrom,
            grid: [currentRows, currentCols],
          },
        });

        timelineRef.current = tl;
      });
    },
    [],
  );

  const restartAnimation = useCallback(
    (
      currentStagger: number,
      currentEase: EaseOption,
      currentFrom: StaggerFrom,
      currentCols: number,
      currentRows: number,
      startPlaying: boolean,
    ) => {
      const el = scopeRef.current;
      if (!el) return;

      // Kill the old context so all tweens/timelines are cleaned up.
      if (ctxRef.current) {
        ctxRef.current.revert();
        ctxRef.current = null;
      }

      const ctx = gsap.context((self) => {
        buildTimeline(
          self,
          currentStagger,
          currentEase,
          currentFrom,
          currentCols,
          currentRows,
          startPlaying,
        );
      }, el);

      ctxRef.current = ctx;
    },
    [buildTimeline],
  );

  // Initial mount — build the timeline (paused or playing per motion store).
  useLayoutEffect(() => {
    const el = scopeRef.current;
    if (!el) return;

    const ctx = gsap.context((self) => {
      buildTimeline(self, stagger, ease, from, cols, rows, playing);
    }, el);

    ctxRef.current = ctx;

    return () => {
      ctx.revert();
      ctxRef.current = null;
    };
    // Only on mount — param changes are handled via restartAnimation below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restart whenever any animation parameter changes (grid size causes a
  // re-render, so the DOM is already updated before this effect fires).
  useLayoutEffect(() => {
    // Skip the very first render — the mount effect above handles it.
    if (!ctxRef.current && !timelineRef.current) return;
    restartAnimation(stagger, ease, from, cols, rows, playing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagger, ease, from, cols, rows]);

  // Play or pause the existing timeline when the motion store toggles.
  // Does NOT rebuild the timeline — just calls .play()/.pause() on it.
  useLayoutEffect(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    if (playing) {
      tl.play();
    } else {
      tl.pause();
    }
  }, [playing]);

  function handleReplay() {
    const tl = timelineRef.current;
    if (!tl) return;
    tl.restart();
  }

  const staggerLabelId = "stagger-amount-label";
  const colsLabelId = "grid-cols-label";

  return (
    <PlayShell
      slug="gsap-stagger"
      title="Stagger Grid"
      visualLabel="Stagger grid animation: a ripple wave of colored tiles spreading from the center"
      controls={
        <>
          {/* Stagger amount */}
          <div className="flex items-center gap-2">
            <span id={staggerLabelId} className="text-xs text-foreground/70">
              stagger
            </span>
            <input
              type="range"
              min={0}
              max={0.2}
              step={0.005}
              value={stagger}
              onChange={(e) => setStagger(Number(e.target.value))}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={staggerLabelId}
              aria-valuemin={0}
              aria-valuemax={0.2}
              aria-valuenow={stagger}
            />
            <span className="w-10 text-right text-xs text-foreground/70 tabular-nums">
              {stagger.toFixed(3)}s
            </span>
          </div>

          {/* Grid columns */}
          <div className="flex items-center gap-2">
            <span id={colsLabelId} className="text-xs text-foreground/70">
              cols
            </span>
            <input
              type="range"
              min={4}
              max={20}
              step={1}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={colsLabelId}
              aria-valuemin={4}
              aria-valuemax={20}
              aria-valuenow={cols}
            />
            <span className="w-6 text-right text-xs text-foreground/70 tabular-nums">{cols}</span>
          </div>

          {/* Easing */}
          <div className="flex items-center gap-2">
            <label htmlFor="ease-select" className="sr-only">
              Easing
            </label>
            <span className="text-xs text-foreground/70" aria-hidden="true">
              ease
            </span>
            <select
              id="ease-select"
              value={ease}
              onChange={(e) => setEase(e.target.value as EaseOption)}
              className={selectClass}
            >
              {EASE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Stagger origin */}
          <div className="flex items-center gap-2">
            <label htmlFor="from-select" className="sr-only">
              Stagger origin
            </label>
            <span className="text-xs text-foreground/70" aria-hidden="true">
              from
            </span>
            <select
              id="from-select"
              value={from}
              onChange={(e) => setFrom(e.target.value as StaggerFrom)}
              className={selectClass}
            >
              {FROM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Replay */}
          <button
            type="button"
            onClick={handleReplay}
            className={btnClass}
            aria-label="Replay animation"
          >
            Replay
          </button>
        </>
      }
      attribution={
        <>
          Technique: GSAP timeline + grid stagger,{" "}
          <a
            href="https://gsap.com/docs/v3/Staggers/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            GSAP Stagger docs
          </a>{" "}
          by GreenSock
        </>
      }
    >
      <div ref={scopeRef} className="absolute inset-0" aria-hidden="true">
        <div
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: "3px",
          }}
          role="presentation"
        >
          {cells.map(({ index, row, col }) => {
            const h = cellHue(row, col, cols, rows);
            const color = tileColor(h, theme);
            return (
              <div
                key={index}
                className="stagger-tile rounded-sm"
                suppressHydrationWarning
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>
    </PlayShell>
  );
}
