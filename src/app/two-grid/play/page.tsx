"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { hsl, hslString } from "@/lib/creative/color";
import { map, TAU } from "@/lib/creative/math";
import { gridPositions, centerDistance, pulseScale } from "../grid-layout";

const COLS = 10;
const ROWS = 10;
const CELL_SIZE = 48;
const SHAPE_SIZE = 34;

/** Stage background color keyed by resolved theme name. */
const STAGE_BG: Record<string, string> = {
  light: "#e5e7eb", // gray-200: neutral, high-contrast for colored shapes
  dark: "#0f0f0f", // near-black
};
const STAGE_BG_DEFAULT = "#0f0f0f";

export default function TwoGridPlayPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const stageBg = resolvedTheme
      ? (STAGE_BG[resolvedTheme] ?? STAGE_BG_DEFAULT)
      : STAGE_BG_DEFAULT;

    (async () => {
      const Two = (await import("two.js")).default;
      if (cancelled) return;

      const two = new Two({ fitted: true, autostart: false }).appendTo(containerEl);

      // Apply theme-aware stage background to the SVG element.
      const svgEl = containerEl.querySelector("svg");
      if (svgEl) {
        svgEl.style.background = stageBg;
      }

      const cells = gridPositions(COLS, ROWS, CELL_SIZE, CELL_SIZE);
      const totalW = COLS * CELL_SIZE;
      const totalH = ROWS * CELL_SIZE;

      // Offset so the grid is centred in two.js coordinate space.
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
          // Each shape rotates at a rate influenced by distance from center.
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
  }, [resolvedTheme]);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-2 justify-between border-b border-border shrink-0">
        <nav aria-label="Breadcrumb">
          <Link
            href="/two-grid"
            className="text-sm text-foreground/70 hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            &larr; Vector Grid
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide text-foreground/80">
          Vector Grid &mdash; Live Sketch
        </h1>
        <span aria-hidden="true" className="hidden sm:block w-24" />
      </header>

      <section
        className="flex-1 relative overflow-hidden"
        aria-label="Animated vector grid sketch. One hundred squares arranged in a 10 by 10 grid rotate and pulse in a wave from the center outward."
      >
        <div
          ref={containerRef}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          role="img"
          aria-label="Live animation: 100 rotating, color-shifting squares in a rippling wave pattern"
        />
      </section>

      <footer className="px-4 sm:px-6 py-3 sm:py-4 text-xs text-foreground/70 border-t border-border shrink-0">
        Technique: two.js scene graph + per-shape transform wave.{" "}
        <a
          href="https://two.js.org/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="two.js library by Jono Brandel (opens in new tab)"
          className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          two.js
        </a>{" "}
        by Jono Brandel (MIT).
      </footer>
    </main>
  );
}
