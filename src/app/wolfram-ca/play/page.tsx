"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { hsl, hslToRgb } from "@/lib/creative/color";
import { clamp } from "@/lib/creative/math";
import { nextRow, firstRow } from "../elementary";

/** Preset rules that show distinct visual behavior. */
const PRESET_RULES = [30, 90, 110, 184] as const;

/** Cell size in logical pixels. Smaller = more generations visible. */
const CELL_PX = 2;

/**
 * Converts a cell state (0 or 1) to an RGBA tuple.
 *
 * Dark theme: dark background, bright saturated cells.
 * Light theme: light background, dark saturated cells (AA contrast).
 */
function cellToRgba(
  alive: number,
  row: number,
  totalRows: number,
  theme: "dark" | "light",
): [number, number, number, number] {
  if (alive === 0) {
    return theme === "dark" ? [12, 12, 18, 255] : [245, 245, 250, 255];
  }

  // Shift hue slightly as generations progress for a subtle gradient.
  const t = clamp(row / Math.max(totalRows - 1, 1), 0, 1);
  const hue = (180 + t * 120) % 360;

  if (theme === "light") {
    const { r, g, b } = hslToRgb(hsl(hue, 0.85, 0.28));
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
  }

  const { r, g, b } = hslToRgb(hsl(hue, 0.9, 0.65));
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
}

/**
 * Renders all CA generations into `imageData`.
 * Each logical cell is CELL_PX x CELL_PX physical pixels.
 */
function renderCA(imageData: ImageData, rule: number, theme: "dark" | "light"): void {
  const { width, height, data } = imageData;

  const cols = Math.floor(width / CELL_PX);
  const rows = Math.floor(height / CELL_PX);
  if (cols <= 0 || rows <= 0) return;

  // Build all generations.
  const generations: Uint8Array[] = [];
  generations.push(firstRow(cols, "center"));
  for (let r = 1; r < rows; r++) {
    const prev = generations[r - 1];
    if (prev === undefined) break;
    generations.push(nextRow(prev, rule));
  }

  // Write into the ImageData buffer.
  for (let r = 0; r < rows; r++) {
    const gen = generations[r];
    if (gen === undefined) break;
    for (let c = 0; c < cols; c++) {
      const cell = gen[c] ?? 0;
      const [red, green, blue, alpha] = cellToRgba(cell, r, rows, theme);
      const startY = r * CELL_PX;
      const startX = c * CELL_PX;
      for (let dy = 0; dy < CELL_PX; dy++) {
        for (let dx = 0; dx < CELL_PX; dx++) {
          const idx = ((startY + dy) * width + (startX + dx)) * 4;
          data[idx] = red;
          data[idx + 1] = green;
          data[idx + 2] = blue;
          data[idx + 3] = alpha;
        }
      }
    }
  }
}

export default function WolframCaPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rule, setRule] = useState<number>(30);
  const [inputValue, setInputValue] = useState<string>("30");
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [seed, setSeed] = useState<number>(0); // increment to trigger restart

  const { resolvedTheme } = useTheme();
  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";

  // Fit canvas to its CSS box and observe resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = (): void => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;

      const physW = Math.round(cssW * dpr);
      const physH = Math.round(cssH * dpr);
      canvas.width = physW;
      canvas.height = physH;
      setSize({ w: physW, h: physH });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Re-render whenever rule, size, theme, or seed changes.
  useEffect(() => {
    if (!size) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(size.w, size.h);
    renderCA(imageData, rule, theme);
    ctx.putImageData(imageData, 0, 0);
  }, [rule, size, theme, seed]);

  const handleRuleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 255) {
      setRule(parsed);
    }
  }, []);

  const handlePreset = useCallback((r: number) => {
    setRule(r);
    setInputValue(String(r));
  }, []);

  const handleRestart = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  const isDark = theme === "dark";
  const pageBg = isDark ? "bg-[#0c0c12] text-white" : "bg-[#f5f5fa] text-foreground";
  const borderColor = isDark ? "border-white/10" : "border-border";
  const mutedText = isDark ? "text-white/60" : "text-foreground/60";
  const headingText = isDark ? "text-white/80" : "text-foreground/80";
  const btnBase =
    "rounded border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2";
  const btnStyle = isDark
    ? `${btnBase} border-white/20 text-white/70 hover:border-white/50 hover:text-white focus-visible:ring-white/50`
    : `${btnBase} border-border text-foreground/70 hover:border-foreground/40 hover:text-foreground focus-visible:ring-foreground/40`;
  const btnActive = isDark
    ? "border-white/60 text-white bg-white/10"
    : "border-foreground/50 text-foreground bg-foreground/10";
  const inputStyle = isDark
    ? "w-16 rounded border border-white/20 bg-transparent px-2 py-1 text-sm text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-white/50"
    : "w-16 rounded border border-border bg-transparent px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-foreground/40";

  return (
    <main className={`flex min-h-screen flex-col ${pageBg}`}>
      <header className={`shrink-0 border-b ${borderColor} px-4 py-3 sm:px-6`}>
        <div className="flex flex-wrap items-center gap-3">
          <nav aria-label="Page navigation">
            <Link
              href="/wolfram-ca"
              className={`inline-flex items-center gap-1 rounded text-sm ${mutedText} underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/40`}
              aria-label="Back to Elementary CA detail page"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Link>
          </nav>

          <h1 className={`text-sm font-medium tracking-wide ${headingText}`}>Elementary CA</h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Rule number input */}
            <label className={`flex items-center gap-1.5 text-sm ${mutedText}`}>
              Rule
              <input
                type="number"
                min={0}
                max={255}
                value={inputValue}
                onChange={handleRuleInput}
                className={inputStyle}
                aria-label="Rule number (0 to 255)"
              />
            </label>

            {/* Preset buttons */}
            {PRESET_RULES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handlePreset(r)}
                className={`${btnStyle} ${rule === r ? btnActive : ""}`}
                aria-pressed={rule === r}
                aria-label={`Switch to rule ${r}`}
              >
                {r}
              </button>
            ))}

            <button
              type="button"
              onClick={handleRestart}
              className={btnStyle}
              aria-label="Restart the simulation from a single centered cell"
            >
              Restart
            </button>
          </div>
        </div>
      </header>

      <section
        className="relative flex-1"
        aria-label={`Elementary cellular automaton canvas using rule ${rule}`}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-label={`Rule ${rule} elementary cellular automaton. Each row is one generation, growing downward from a single centered cell at the top.`}
          style={{ imageRendering: "pixelated" }}
        />
      </section>

      <footer className={`shrink-0 border-t ${borderColor} px-6 py-3 text-xs ${mutedText}`}>
        Wolfram elementary 1D rules. Original framework by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Elementary_cellular_automaton"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-70"
        >
          Stephen Wolfram
        </a>
        . 256 possible rules, each a universe of its own.
      </footer>
    </main>
  );
}
