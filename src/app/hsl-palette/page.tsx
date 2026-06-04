"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { hsl, hslToRgb, rgbToHex, hslString } from "@/lib/creative/color";
import type { Hsl } from "@/lib/creative/color";
import { generatePalette, readableText } from "./palette";
import type { Scheme } from "./palette";

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
        <span className="text-xs tabular-nums text-foreground/50">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current cursor-pointer"
        aria-label={label}
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
  const textColor = readableText(color);
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
      className="relative flex flex-col items-center justify-center gap-2 rounded-xl p-6 transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        backgroundColor: hslString(color),
        color: textColor,
        minHeight: "160px",
      }}
      aria-label={`Copy ${hex} to clipboard`}
    >
      {copied ? (
        <span className="text-sm font-semibold tracking-wide">Copied</span>
      ) : (
        <>
          <span className="text-lg font-bold tracking-widest">{hex}</span>
          <span className="text-xs opacity-70">{hslLabel}</span>
        </>
      )}
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
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-foreground/10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-sm text-foreground/50 hover:text-foreground underline underline-offset-2"
          >
            &larr; home
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide">HSL Palette</h1>
        <div className="w-20" aria-hidden="true" />
      </header>

      <div className="flex flex-col lg:flex-row flex-1">
        <aside
          className="w-full lg:w-72 shrink-0 px-6 py-8 border-b lg:border-b-0 lg:border-r border-foreground/10 flex flex-col gap-8"
          aria-label="Color controls"
        >
          <section aria-labelledby="controls-heading">
            <h2
              id="controls-heading"
              className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-4"
            >
              Base Color
            </h2>
            <div className="flex flex-col gap-5">
              <Slider
                id="hue"
                label="Hue"
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
            className="h-16 w-full rounded-lg border border-foreground/10"
            style={{ backgroundColor: hslString(base) }}
            aria-label={`Base color preview: ${rgbToHex(hslToRgb(base))}`}
          />

          <section aria-labelledby="scheme-heading">
            <h2
              id="scheme-heading"
              className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-4"
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
                    "text-left px-3 py-2 rounded-lg text-sm transition-colors",
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

        <section className="flex-1 px-6 py-8" aria-label="Generated color palette">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-6">
            {SCHEME_LABELS[scheme]} ({palette.length} colors) — click to copy
          </h2>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${palette.length}, minmax(0, 1fr))`,
            }}
          >
            {palette.map((color, i) => (
              <Swatch key={i} color={color} />
            ))}
          </div>
        </section>
      </div>

      <footer className="px-6 py-4 text-xs text-foreground/30 border-t border-foreground/10">
        Original work. HSL harmony math using hue rotation on the base color.
      </footer>
    </main>
  );
}
