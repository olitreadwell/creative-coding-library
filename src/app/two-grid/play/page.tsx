"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColors } from "@/lib/creative";
import { map, TAU } from "@/lib/creative/math";
import { usePlaying } from "@/lib/creative/motion";
import { gridPositions, centerDistance, pulseScale } from "../grid-layout";

// ---------------------------------------------------------------------------
// Default constants — values here should match the original sketch so the
// default state is visually unchanged.
// ---------------------------------------------------------------------------
const DEFAULT_GRID_SIZE = 10;
const DEFAULT_WAVE_SPEED = 18; // maps to 0.018 time-per-frame (÷1000)
const DEFAULT_AMPLITUDE = 50; // maps to 0.5 spread multiplier (÷100)
const DEFAULT_COLOR_SCHEME = "default";

const CELL_SIZE = 48;
const SHAPE_SIZE = 34;

/** Stage background color keyed by resolved theme name. */
const STAGE_BG: Record<string, string> = {
  light: "#e5e7eb",
  dark: "#0f0f0f",
};
const STAGE_BG_DEFAULT = "#0f0f0f";

// ---------------------------------------------------------------------------
// Color schemes — 4 options, all using only cbColors palette entries so every
// scheme is colorblind-safe. We store named keys and derive the actual colors
// at render time so light/dark theme changes are reflected correctly.
// ---------------------------------------------------------------------------
type SchemeKey = "default" | "warm" | "cool" | "mono";

interface ColorScheme {
  label: string;
  /** Maps a cell index to a palette index from cbColors(theme). */
  paletteIndex: (i: number) => number;
  /** Opacity range [min, max] added to the pulse. */
  opacityMin: number;
  opacityMax: number;
}

const COLOR_SCHEMES: Record<SchemeKey, ColorScheme> = {
  default: {
    label: "Default",
    paletteIndex: (i) => i % 6,
    opacityMin: 0.75,
    opacityMax: 1.0,
  },
  warm: {
    // Uses orange (idx 1), vermillion (idx 5), yellow (idx 3), purple (idx 4)
    // — reads as warm on both themes.
    label: "Warm",
    paletteIndex: (i) => [1, 5, 3, 4, 1, 5][i % 6] as number,
    opacityMin: 0.8,
    opacityMax: 1.0,
  },
  cool: {
    // Sky blue (idx 0), green (idx 2), blue (idx 0 on light = 0072B2).
    // Cycles across blue/teal axis — protanopia safe.
    label: "Cool",
    paletteIndex: (i) => [0, 2, 0, 2, 0, 2][i % 6] as number,
    opacityMin: 0.65,
    opacityMax: 1.0,
  },
  mono: {
    // Single hue (sky blue / blue) at two alternating intensities via opacity.
    label: "Mono",
    paletteIndex: (_i) => 0,
    opacityMin: 0.4,
    opacityMax: 1.0,
  },
};

// ---------------------------------------------------------------------------
// Slider bounds
// ---------------------------------------------------------------------------
const GRID_MIN = 4;
const GRID_MAX = 20;
const SPEED_MIN = 5;
const SPEED_MAX = 60;
const AMP_MIN = 10;
const AMP_MAX = 100;

const btnClass =
  "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function TwoGridPlayPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  // Global motion state from the shared store. Responds live to the
  // Play/Pause toggle in PlayShell and to OS prefers-reduced-motion.
  const playing = usePlaying();

  // Control state (React)
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [waveSpeed, setWaveSpeed] = useState(DEFAULT_WAVE_SPEED);
  const [amplitude, setAmplitude] = useState(DEFAULT_AMPLITUDE);
  const [colorScheme, setColorScheme] = useState<SchemeKey>(DEFAULT_COLOR_SCHEME);

  // Live refs so the two.js update loop reads current values without
  // needing to tear down and rebuild the scene on every slider tick.
  const gridSizeRef = useRef(gridSize);
  const waveSpeedRef = useRef(waveSpeed);
  const amplitudeRef = useRef(amplitude);
  const colorSchemeRef = useRef<SchemeKey>(colorScheme);
  // Ref for playing so the update handler always reads the latest value
  // without stale-closure issues.
  const playingRef = useRef(playing);

  // Keep refs in sync with state.
  useEffect(() => {
    gridSizeRef.current = gridSize;
  }, [gridSize]);
  useEffect(() => {
    waveSpeedRef.current = waveSpeed;
  }, [waveSpeed]);
  useEffect(() => {
    amplitudeRef.current = amplitude;
  }, [amplitude]);
  useEffect(() => {
    colorSchemeRef.current = colorScheme;
  }, [colorScheme]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Stable ref to the live two.js instance so the play/pause effect below
  // can drive it without rebuilding the scene.
  const twoRef = useRef<InstanceType<typeof import("two.js").default> | null>(null);

  // The two.js scene is rebuilt when theme or gridSize changes (because the
  // scene graph depends on total number of shapes).
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const stageBg = resolvedTheme
      ? (STAGE_BG[resolvedTheme] ?? STAGE_BG_DEFAULT)
      : STAGE_BG_DEFAULT;

    const isLight = resolvedTheme === "light";
    const themeKey = isLight ? "light" : "dark";

    // Read the current grid size at mount time.
    const cols = gridSizeRef.current;
    const rows = gridSizeRef.current;

    (async () => {
      const Two = (await import("two.js")).default;
      if (cancelled) return;

      const two = new Two({ fitted: true, autostart: false }).appendTo(containerEl);
      twoRef.current = two;

      const svgEl = containerEl.querySelector("svg");
      if (svgEl) {
        svgEl.style.background = stageBg;
      }

      const cells = gridPositions(cols, rows, CELL_SIZE, CELL_SIZE);
      const totalW = cols * CELL_SIZE;
      const totalH = rows * CELL_SIZE;

      const offsetX = (two.width - totalW) / 2;
      const offsetY = (two.height - totalH) / 2;

      const shapeLightnessMin = isLight ? 0.3 : 0.5;
      const shapeLightnessMax = isLight ? 0.5 : 0.75;

      type ShapeRef = {
        rect: InstanceType<typeof Two.Rectangle>;
        distance: number;
        cellIndex: number;
      };

      const palette = cbColors(themeKey);

      const shapes: ShapeRef[] = cells.map(({ x, y, row, col }, i) => {
        const distance = centerDistance(row, col, cols, rows);
        const baseColor = palette[i % palette.length] as string;

        const rect = two.makeRectangle(offsetX + x, offsetY + y, SHAPE_SIZE, SHAPE_SIZE);
        rect.fill = baseColor;
        rect.noStroke();

        return { rect, distance, cellIndex: i };
      });

      let frame = 0;

      two.bind("update", () => {
        // When paused, skip mutations so the scene freezes on the current frame.
        if (!playingRef.current) return;

        frame += 1;

        // Read live control values from refs on every frame.
        const speed = waveSpeedRef.current / 1000; // e.g. 18 → 0.018
        const amp = amplitudeRef.current / 100; // e.g. 50 → 0.5, scales spread
        const scheme = COLOR_SCHEMES[colorSchemeRef.current];
        const livePalette = cbColors(themeKey);

        const t = frame * speed;
        const spread = TAU * 1.5 * (0.3 + amp * 1.4); // amp scales ripple spread

        for (const { rect, distance, cellIndex } of shapes) {
          rect.rotation += 0.008 + distance * 0.014;

          const s = pulseScale(distance, t, spread);
          rect.scale = s;

          const hueShift = Math.round(Math.sin(t - distance * TAU * 0.5));
          const rawIdx = scheme.paletteIndex(cellIndex);
          const colorIndex =
            (((rawIdx + hueShift) % livePalette.length) + livePalette.length) % livePalette.length;
          const paletteColor = livePalette[colorIndex] as string;

          const lightnessFraction = map(s, shapeLightnessMin, shapeLightnessMax, 0, 1);
          const alpha =
            scheme.opacityMin + lightnessFraction * (scheme.opacityMax - scheme.opacityMin);
          rect.fill = paletteColor;
          rect.opacity = alpha;
        }
      });

      // Render one static frame so the grid is visible even when paused.
      two.update();

      // Start animating only when the store says playing.
      if (playingRef.current) {
        two.play();
      }

      cleanup = () => {
        two.pause();
        two.clear();
        twoRef.current = null;
        if (containerEl) containerEl.innerHTML = "";
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // Rebuild when theme changes. gridSize changes trigger a rebuild via the
    // dependency below; speed/amplitude/colorScheme are read live from refs.
    // `playing` is intentionally excluded: handled by the effect below.
  }, [resolvedTheme, gridSize]);

  // React live to the Play/Pause toggle without rebuilding the scene.
  useEffect(() => {
    const two = twoRef.current;
    if (!two) return;
    if (playing) {
      two.play();
    } else {
      two.pause();
    }
  }, [playing]);

  // Label IDs for ARIA association.
  const gridSizeLabelId = "two-grid-size-label";
  const speedLabelId = "two-wave-speed-label";
  const ampLabelId = "two-amplitude-label";

  return (
    <PlayShell
      slug="two-grid"
      title="Vector Grid"
      visualLabel="Animated vector grid sketch. Squares arranged in a grid rotate and pulse in a wave from the center outward."
      controls={
        <>
          {/* Grid size */}
          <div className="flex items-center gap-2">
            <span id={gridSizeLabelId} className="text-xs text-foreground/70">
              grid
            </span>
            <input
              type="range"
              min={GRID_MIN}
              max={GRID_MAX}
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={gridSizeLabelId}
              aria-valuemin={GRID_MIN}
              aria-valuemax={GRID_MAX}
              aria-valuenow={gridSize}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {gridSize}
            </span>
          </div>

          {/* Wave speed */}
          <div className="flex items-center gap-2">
            <span id={speedLabelId} className="text-xs text-foreground/70">
              speed
            </span>
            <input
              type="range"
              min={SPEED_MIN}
              max={SPEED_MAX}
              value={waveSpeed}
              onChange={(e) => setWaveSpeed(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={speedLabelId}
              aria-valuemin={SPEED_MIN}
              aria-valuemax={SPEED_MAX}
              aria-valuenow={waveSpeed}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {waveSpeed}
            </span>
          </div>

          {/* Wave amplitude */}
          <div className="flex items-center gap-2">
            <span id={ampLabelId} className="text-xs text-foreground/70">
              ripple
            </span>
            <input
              type="range"
              min={AMP_MIN}
              max={AMP_MAX}
              value={amplitude}
              onChange={(e) => setAmplitude(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={ampLabelId}
              aria-valuemin={AMP_MIN}
              aria-valuemax={AMP_MAX}
              aria-valuenow={amplitude}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {amplitude}
            </span>
          </div>

          {/* Color scheme */}
          <div className="flex items-center gap-2">
            <label htmlFor="two-color-scheme" className="text-xs text-foreground/70">
              colors
            </label>
            <select
              id="two-color-scheme"
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as SchemeKey)}
              className={`${btnClass} bg-transparent text-xs py-0.5`}
              aria-label="Color scheme"
            >
              {(Object.keys(COLOR_SCHEMES) as SchemeKey[]).map((key) => (
                <option key={key} value={key}>
                  {COLOR_SCHEMES[key].label}
                </option>
              ))}
            </select>
          </div>
        </>
      }
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
        aria-label="Live animation: rotating, color-shifting squares in a rippling wave pattern. Grid size and wave behavior are adjustable via the controls panel."
      />
    </PlayShell>
  );
}
