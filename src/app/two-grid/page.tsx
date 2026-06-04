"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { hsl, hslString } from "@/lib/creative/color";
import { map, TAU } from "@/lib/creative/math";
import { gridPositions, centerDistance, pulseScale } from "./grid-layout";

const COLS = 10;
const ROWS = 10;
const CELL_SIZE = 48;
const SHAPE_SIZE = 34;

export default function TwoGridPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const Two = (await import("two.js")).default;
      if (cancelled) return;

      const two = new Two({ fitted: true, autostart: false }).appendTo(containerEl);

      const cells = gridPositions(COLS, ROWS, CELL_SIZE, CELL_SIZE);
      const totalW = COLS * CELL_SIZE;
      const totalH = ROWS * CELL_SIZE;

      // Offset so the grid is centred in two.js coordinate space (origin = top-left of SVG).
      // two.js default origin for shapes is top-left of the canvas, so we shift by half
      // the canvas size minus half the grid size to centre it.
      const offsetX = (two.width - totalW) / 2;
      const offsetY = (two.height - totalH) / 2;

      type ShapeRef = {
        rect: InstanceType<typeof Two.Rectangle>;
        distance: number;
        baseHue: number;
      };

      const shapes: ShapeRef[] = cells.map(({ x, y, row, col }) => {
        const distance = centerDistance(row, col, COLS, ROWS);
        // Hue spreads from blue-purple (center) to teal (edge).
        const baseHue = map(distance, 0, 1, 260, 180);
        const color = hslString(hsl(baseHue, 0.7, 0.55));

        const rect = two.makeRectangle(offsetX + x, offsetY + y, SHAPE_SIZE, SHAPE_SIZE);
        rect.fill = color;
        rect.noStroke();

        return { rect, distance, baseHue };
      });

      let frame = 0;

      two.bind("update", () => {
        frame += 1;
        const t = frame * 0.018; // time in radians

        for (const { rect, distance, baseHue } of shapes) {
          // Each shape rotates at a rate influenced by distance.
          rect.rotation += 0.008 + distance * 0.014;

          // Scale pulses outward from the center.
          const s = pulseScale(distance, t);
          rect.scale = s;

          // Hue shifts slightly over time for a colour-wave effect.
          const hueShift = Math.sin(t - distance * TAU * 0.5) * 20;
          const lightness = map(s, 0.5, 1.2, 0.4, 0.7);
          rect.fill = hslString(hsl(baseHue + hueShift, 0.75, lightness));
        }
      });

      two.play();

      cleanup = () => {
        two.pause();
        two.clear();
        if (containerEl) containerEl.innerHTML = "";
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

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
        <h1 className="text-sm font-medium tracking-wide">Vector Grid</h1>
        <span aria-hidden="true" />
      </header>

      <section
        className="flex-1 relative overflow-hidden"
        aria-label="Animated vector grid"
        aria-live="polite"
        aria-atomic="false"
      >
        <div
          ref={containerRef}
          className="absolute inset-0"
          role="presentation"
          aria-hidden="true"
        />
      </section>

      <footer className="px-6 py-4 text-xs text-foreground/40 border-t border-foreground/10">
        Technique: two.js scene graph + per-shape transform wave.{" "}
        <a
          href="https://two.js.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          two.js
        </a>{" "}
        by Jono Brandel (MIT).
      </footer>
    </main>
  );
}
