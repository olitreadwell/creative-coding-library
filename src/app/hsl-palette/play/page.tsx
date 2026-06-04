"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { hsl, hslToRgb, rgbToHex, hslString } from "@/lib/creative/color";
import type { Hsl } from "@/lib/creative/color";
import { generatePalette } from "../palette";
import type { Scheme } from "../palette";

const SCHEMES: Scheme[] = ["complementary", "analogous", "triadic", "tetradic", "monochromatic"];

const SCHEME_LABELS: Record<Scheme, string> = {
  complementary: "Complementary",
  analogous: "Analogous",
  triadic: "Triadic",
  tetradic: "Tetradic",
  monochromatic: "Monochromatic",
};

const COPY_TIMEOUT_MS = 1500;

type SliderProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
};

function Slider({ id, label, min, max, step, value, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <label htmlFor={id} className="text-xs font-medium text-foreground/70">
          {label}
        </label>
        <span className="text-xs tabular-nums text-foreground/70" aria-hidden="true">
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

type SwatchProps = {
  color: Hsl;
};

function Swatch({ color }: SwatchProps) {
  const [copied, setCopied] = useState(false);

  const hex = rgbToHex(hslToRgb(color));
  const hslLabel = `hsl(${Math.round(color.h)} ${Math.round(color.s * 100)}% ${Math.round(color.l * 100)}%)`;

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_TIMEOUT_MS);
    } catch {
      // Clipboard access denied or unavailable — silently ignore.
    }
  }, [hex]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex flex-col items-center justify-center gap-2 rounded-xl p-6 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{
        backgroundColor: hslString(color),
        minHeight: "160px",
      }}
      aria-label={`Copy ${hex} to clipboard`}
    >
      {/* Labels sit on a dark pill so they stay AA-readable on any swatch color. */}
      <span className="flex flex-col items-center gap-1 rounded-lg bg-black/65 px-3 py-2 text-center">
        {copied ? (
          <span className="text-sm font-semibold tracking-wide text-white">Copied</span>
        ) : (
          <>
            <span className="text-lg font-bold tracking-widest text-white">{hex}</span>
            <span className="text-xs text-white/85">{hslLabel}</span>
          </>
        )}
      </span>
    </button>
  );
}

export default function HslPalettePage() {
  const [hue, setHue] = useState(210);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(50);
  const [scheme, setScheme] = useState<Scheme>("triadic");

  const base: Hsl = hsl(hue, saturation / 100, lightness / 100);
  const palette = generatePalette(base, scheme);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border shrink-0">
        <nav aria-label="Site navigation">
          <Link
            href="/hsl-palette"
            aria-label="Back to HSL Palette detail page"
            className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide">HSL Palette</h1>
        <div className="w-20" aria-hidden="true" />
      </header>

      <div className="flex flex-col lg:flex-row flex-1">
        <aside
          className="w-full lg:w-72 shrink-0 px-6 py-8 border-b lg:border-b-0 lg:border-r border-border flex flex-col gap-8 bg-card"
          aria-label="Color controls"
        >
          <section aria-labelledby="controls-heading">
            <h2
              id="controls-heading"
              className="text-xs font-semibold uppercase tracking-widest text-foreground/70 mb-4"
            >
              Base Color
            </h2>
            <div className="flex flex-col gap-5">
              <Slider
                id="hue"
                label="Hue (0–360°)"
                min={0}
                max={360}
                step={1}
                value={hue}
                onChange={setHue}
              />
              <Slider
                id="saturation"
                label="Saturation %"
                min={0}
                max={100}
                step={1}
                value={saturation}
                onChange={setSaturation}
              />
              <Slider
                id="lightness"
                label="Lightness %"
                min={0}
                max={100}
                step={1}
                value={lightness}
                onChange={setLightness}
              />
            </div>
          </section>

          <div
            className="h-16 w-full rounded-lg border border-border"
            style={{ backgroundColor: hslString(base) }}
            role="img"
            aria-label={`Base color preview: ${rgbToHex(hslToRgb(base))}`}
          />

          <section aria-labelledby="scheme-heading">
            <h2
              id="scheme-heading"
              className="text-xs font-semibold uppercase tracking-widest text-foreground/70 mb-4"
            >
              Harmony Scheme
            </h2>
            <div className="flex flex-col gap-2" role="group" aria-label="Select harmony scheme">
              {SCHEMES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScheme(s)}
                  className={[
                    "text-left px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    s === scheme
                      ? "bg-foreground text-background font-medium"
                      : "hover:bg-foreground/10 text-foreground/70",
                  ].join(" ")}
                  aria-pressed={s === scheme}
                >
                  {SCHEME_LABELS[s]}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="flex-1 px-6 py-8 bg-background" aria-label="Generated color palette">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/70 mb-6">
            {SCHEME_LABELS[scheme]} ({palette.length} colors) — click to copy
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
            {palette.map((color, i) => (
              <Swatch key={i} color={color} />
            ))}
          </div>
        </section>
      </div>

      <footer className="px-6 py-4 text-xs text-foreground/70 border-t border-border bg-card">
        Original work. HSL harmony math using hue rotation on the base color.
      </footer>
    </main>
  );
}
