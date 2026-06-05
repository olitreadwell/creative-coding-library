"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
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

  const btnClass =
    "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const btnActive = "border-foreground/50 text-foreground bg-foreground/10";
  const inputClass =
    "w-16 rounded border border-border bg-transparent px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <PlayShell
      slug="wolfram-ca"
      title="Elementary CA"
      visualLabel={`Rule ${rule} elementary cellular automaton, each row one generation growing downward from a single centered cell`}
      controls={
        <>
          {/* Rule number input */}
          <label className="flex items-center gap-1.5 text-sm text-foreground/70">
            Rule
            <input
              type="number"
              min={0}
              max={255}
              value={inputValue}
              onChange={handleRuleInput}
              className={inputClass}
              aria-label="Rule number (0 to 255)"
            />
          </label>

          {/* Preset buttons */}
          {PRESET_RULES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handlePreset(r)}
              className={`${btnClass} ${rule === r ? btnActive : ""}`}
              aria-pressed={rule === r}
              aria-label={`Switch to rule ${r}`}
            >
              {r}
            </button>
          ))}

          <button
            type="button"
            onClick={handleRestart}
            className={btnClass}
            aria-label="Restart the simulation from a single centered cell"
          >
            Restart
          </button>
        </>
      }
      attribution={
        <>
          Wolfram elementary 1D rules. Original framework by{" "}
          <a
            href="https://en.wikipedia.org/wiki/Elementary_cellular_automaton"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Stephen Wolfram
          </a>
          . 256 possible rules, each a universe of its own.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label={`Rule ${rule} elementary cellular automaton. Each row is one generation, growing downward from a single centered cell at the top.`}
        style={{ imageRendering: "pixelated" }}
      />
    </PlayShell>
  );
}
