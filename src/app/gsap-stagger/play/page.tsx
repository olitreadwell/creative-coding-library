"use client";

import { useLayoutEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { gsap } from "gsap";
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

export default function StaggerGridPage() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

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
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-y-2 justify-between border-b border-border shrink-0">
        <nav aria-label="Breadcrumb">
          <Link
            href="/gsap-stagger"
            className="text-sm text-foreground/70 hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            &larr; about
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide">Stagger Grid</h1>
        <button
          type="button"
          onClick={handleReplay}
          className="text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Replay animation"
        >
          Replay
        </button>
      </header>

      <section
        ref={scopeRef}
        className="flex-1 flex items-center justify-center px-4 py-12"
        aria-label="Stagger grid animation: a ripple wave of colored tiles spreading from the center"
        aria-live="polite"
        aria-atomic="false"
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
            const color = hslString(hsl(h, 0.7, 0.55));
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
      </section>

      <footer className="px-4 sm:px-6 py-4 text-xs text-foreground/70 border-t border-border shrink-0">
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
      </footer>
    </main>
  );
}
