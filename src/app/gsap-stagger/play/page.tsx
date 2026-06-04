"use client";

import { useLayoutEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { gsap } from "gsap";
import { PlayShell } from "@/components/play-shell";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { gridCells, centerDistance } from "../grid";

const COLS = 12;
const ROWS = 8;
const CELLS = gridCells(COLS, ROWS);

// Map a cell's distance from center to a hue so outer tiles shift in color.
function cellHue(row: number, col: number): number {
  const maxDist = centerDistance(0, 0, COLS, ROWS);
  const d = centerDistance(row, col, COLS, ROWS);
  return map(d, 0, maxDist, 200, 310);
}

// Tile lightness and saturation vary by theme so tiles stay distinct against
// the page background in both light and dark modes.
function tileColor(hue: number, resolvedTheme: string): string {
  const isDark = resolvedTheme !== "light";
  // Dark background: brighter, more vivid tiles (high lightness, high sat).
  // Light background: deeper, more saturated tiles so they don't wash out.
  const saturation = isDark ? 0.72 : 0.8;
  const lightness = isDark ? 0.58 : 0.42;
  return hslString(hsl(hue, saturation, lightness));
}

export default function StaggerGridPage() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme ?? "dark";

  const buildTimeline = useCallback((ctx: gsap.Context) => {
    ctx.add(() => {
      // Tiles stay visible at all times; the wave ripples scale + rotation
      // outward from the center and yoyos back, so the grid is never empty.
      gsap.set(".stagger-tile", { scale: 1, opacity: 1, rotation: 0 });

      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      tl.to(".stagger-tile", {
        scale: 0.45,
        rotation: 180,
        duration: 1.2,
        ease: "sine.inOut",
        stagger: {
          each: 0.045,
          from: "center",
          grid: [ROWS, COLS],
        },
      });

      timelineRef.current = tl;
    });
  }, []);

  useLayoutEffect(() => {
    const el = scopeRef.current;
    if (!el) return;

    // Respect prefers-reduced-motion: skip the infinite animation and leave
    // tiles in their static resting state so users who opt out of motion are
    // not subjected to a continuous looping animation.
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const ctx = gsap.context((self) => {
      buildTimeline(self);
    }, el);

    return () => {
      ctx.revert();
    };
  }, [buildTimeline]);

  function handleReplay() {
    const tl = timelineRef.current;
    if (!tl) return;
    tl.restart();
  }

  return (
    <PlayShell
      slug="gsap-stagger"
      title="Stagger Grid"
      visualLabel="Stagger grid animation: a ripple wave of colored tiles spreading from the center"
      controls={
        <button
          type="button"
          onClick={handleReplay}
          className="text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Replay animation"
        >
          Replay
        </button>
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
      <div
        ref={scopeRef}
        className="absolute inset-0 flex items-center justify-center px-4 py-12"
        aria-hidden="true"
      >
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            width: "min(90vw, 720px)",
          }}
          role="presentation"
        >
          {CELLS.map(({ index, row, col }) => {
            const h = cellHue(row, col);
            const color = tileColor(h, theme);
            return (
              <div
                key={index}
                className="stagger-tile aspect-square rounded-sm"
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
