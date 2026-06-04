"use client";

import { useLayoutEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { hsl, hslString } from "@/lib/creative/color";
import { map } from "@/lib/creative/math";
import { gridCells, centerDistance } from "./grid";

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
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });

      tl.from(".stagger-tile", {
        scale: 0,
        opacity: 0,
        rotation: -45,
        duration: 0.7,
        ease: "power2.inOut",
        stagger: {
          each: 0.04,
          from: "center",
          grid: [ROWS, COLS],
        },
      }).to(
        ".stagger-tile",
        {
          scale: 0,
          opacity: 0,
          rotation: 45,
          duration: 0.55,
          ease: "power2.in",
          stagger: {
            each: 0.03,
            from: "center",
            grid: [ROWS, COLS],
          },
        },
        "+=0.5",
      );

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
      <header className="px-6 py-4 flex items-center justify-between border-b border-foreground/10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-sm text-foreground/60 hover:text-foreground underline underline-offset-2"
          >
            &larr; home
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide">Stagger Grid</h1>
        <button
          type="button"
          onClick={handleReplay}
          className="text-sm px-3 py-1 rounded border border-foreground/20 hover:border-foreground/50 transition-colors"
          aria-label="Replay animation"
        >
          Replay
        </button>
      </header>

      <section
        ref={scopeRef}
        className="flex-1 flex items-center justify-center px-4 py-12"
        aria-label="Stagger grid animation"
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

      <footer className="px-6 py-4 text-xs text-foreground/40 border-t border-foreground/10">
        Technique: GSAP timeline + grid stagger,{" "}
        <a
          href="https://gsap.com/docs/v3/Staggers/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          GSAP Stagger docs
        </a>{" "}
        by GreenSock
      </footer>
    </main>
  );
}
