import { lerp } from "@/lib/creative/math";

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

export type SeasonPalette = {
  bg: string;
  bgDark: string;
  ribbons: [number, number, number][];
  accent: [number, number, number];
};

/**
 * Season palettes built from Okabe-Ito colors. No red/green primary hues.
 * Each ribbon color is [r, g, b] in 0-255 range.
 *
 * spring: sky blue + bluish green (light, airy)
 * summer: yellow + orange (warm, bright)
 * autumn: vermillion + orange + reddish-purple (rich, deep)
 * winter: blue + light gray (cool, quiet)
 */
export const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    bg: "#e8f4f0",
    bgDark: "#071812",
    ribbons: [
      [86, 180, 233], // sky blue   (#56B4E9)
      [0, 158, 115], // bluish green (#009E73)
      [204, 121, 167], // reddish purple (#CC79A7)
      [86, 180, 233], // sky blue repeat for layering
      [0, 158, 115],
    ],
    accent: [204, 121, 167], // soft pink petal dots
  },
  summer: {
    bg: "#fdf6e3",
    bgDark: "#140d00",
    ribbons: [
      [240, 228, 66], // yellow (#F0E442)
      [230, 159, 0], // orange (#E69F00)
      [213, 94, 0], // vermillion (#D55E00)
      [240, 228, 66],
      [230, 159, 0],
    ],
    accent: [240, 228, 66], // bright yellow drift dots
  },
  autumn: {
    bg: "#f5ece0",
    bgDark: "#130800",
    ribbons: [
      [213, 94, 0], // vermillion (#D55E00)
      [230, 159, 0], // orange (#E69F00)
      [204, 121, 167], // reddish purple (#CC79A7)
      [213, 94, 0],
      [230, 159, 0],
    ],
    accent: [230, 159, 0], // amber leaf dots
  },
  winter: {
    bg: "#eef2f7",
    bgDark: "#060b14",
    ribbons: [
      [0, 114, 178], // blue (#0072B2)
      [86, 180, 233], // sky blue (#56B4E9)
      [200, 215, 230], // light gray-blue
      [0, 114, 178],
      [86, 180, 233],
    ],
    accent: [200, 215, 230], // faint snow dots
  },
};

export type RgbTuple = [number, number, number];

/** Linearly interpolate two RGB tuples, clamped to [0, 255]. */
export function lerpRgb(a: RgbTuple, b: RgbTuple, t: number): RgbTuple {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

/** Convert an RGB tuple to a CSS rgba() string. */
export function rgbaTuple(rgb: RgbTuple, alpha: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
}

/**
 * Blend two season palettes by `t` (0 = fully `from`, 1 = fully `to`).
 * Returns blended ribbon colors and accent for that frame.
 */
export function blendSeasonRibbons(
  from: SeasonPalette,
  to: SeasonPalette,
  t: number,
): { ribbons: RgbTuple[]; accent: RgbTuple } {
  const ribbons: RgbTuple[] = from.ribbons.map((colorA, i) => {
    const raw: [number, number, number] | undefined = to.ribbons[i];
    const colorB: RgbTuple = raw ?? to.ribbons[0] ?? [128, 128, 128];
    return lerpRgb(colorA, colorB, t);
  });
  const accent = lerpRgb(from.accent, to.accent, t);
  return { ribbons, accent };
}

/**
 * Blend two hex background colors (#rrggbb) by `t`.
 * Returns a CSS hex string.
 */
export function blendBg(hexA: string, hexB: string, t: number): string {
  const parseHex = (h: string): RgbTuple => {
    const clean = h.replace("#", "");
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  };
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  const blended = lerpRgb(a, b, t);
  return "#" + blended.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/** Return the next season in the cycle. */
export function nextSeason(s: Season): Season {
  const idx = SEASONS.indexOf(s);
  return SEASONS[(idx + 1) % SEASONS.length] ?? "spring";
}
