"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColor } from "@/lib/creative";
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

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      const Two = (await import("two.js")).default;
      if (cancelled) return;

      const two = new Two({ fitted: true, autostart: false }).appendTo(containerEl);

      // Apply theme-aware stage background to the SVG element.
      const svgEl = containerEl.querySelector("svg");
      if (svgEl) {
        svgEl.style.background = stageBg;
      }

      const isLight = resolvedTheme === "light";

      const cells = gridPositions(COLS, ROWS, CELL_SIZE, CELL_SIZE);
      const totalW = COLS * CELL_SIZE;
      const totalH = ROWS * CELL_SIZE;

      // Offset so the grid is centred in two.js coordinate space.
      const offsetX = (two.width - totalW) / 2;
      const offsetY = (two.height - totalH) / 2;

      // Shape lightness bounds tuned per theme for WCAG AA contrast.
      // Light: deep shapes on gray-200 — lightness 0.30–0.50.
      // Dark: bright shapes on near-black — lightness 0.50–0.75.
      const shapeLightnessMin = isLight ? 0.3 : 0.5;
      const shapeLightnessMax = isLight ? 0.5 : 0.75;

      type ShapeRef = {
        rect: InstanceType<typeof Two.Rectangle>;
        distance: number;
        cellIndex: number;
      };

      const shapes: ShapeRef[] = cells.map(({ x, y, row, col }, i) => {
        const distance = centerDistance(row, col, COLS, ROWS);
        // Use colorblind-safe palette color, cycling across cell index.
        // For static frames (reduced motion), pick color at t=0 lightness midpoint.
        const baseColor = cbColor(i, isLight ? "light" : "dark");

        const rect = two.makeRectangle(offsetX + x, offsetY + y, SHAPE_SIZE, SHAPE_SIZE);
        rect.fill = baseColor;
        rect.noStroke();

        return { rect, distance, cellIndex: i };
      });

      if (prefersReducedMotion) {
        // Render a single static frame: shapes sit at rest, no animation.
        two.update();
      } else {
        let frame = 0;

        two.bind("update", () => {
          frame += 1;
          const t = frame * 0.018; // time in radians

          for (const { rect, distance, cellIndex } of shapes) {
            // Each shape rotates at a rate influenced by distance from center.
            rect.rotation += 0.008 + distance * 0.014;

            // Scale pulses outward from the center.
            const s = pulseScale(distance, t);
            rect.scale = s;

            // Shift which cb palette entry is shown based on pulse phase,
            // giving a colour-wave effect that stays colorblind-safe.
            const hueShift = Math.round(Math.sin(t - distance * TAU * 0.5));
            const colorIndex = (((cellIndex + hueShift) % 6) + 6) % 6;
            const paletteColor = cbColor(colorIndex, isLight ? "light" : "dark");

            // Adjust lightness via HSL on top of the palette hex so the wave
            // reads at full contrast throughout the pulse range.
            const lightnessFraction = map(s, shapeLightnessMin, shapeLightnessMax, 0, 1);
            const alpha = 0.75 + lightnessFraction * 0.25;
            rect.fill = paletteColor;
            rect.opacity = alpha;
          }
        });

        two.play();
      }

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
    <PlayShell
      slug="two-grid"
      title="Vector Grid"
      visualLabel="Animated vector grid sketch. One hundred squares arranged in a 10 by 10 grid rotate and pulse in a wave from the center outward."
      attribution={
        <>
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
        </>
      }
    >
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        role="img"
        aria-label="Live animation: 100 rotating, color-shifting squares in a rippling wave pattern"
      />
    </PlayShell>
  );
}
