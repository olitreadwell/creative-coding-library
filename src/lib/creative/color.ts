import { clamp, wrap } from "./math";

export type Hsl = { h: number; s: number; l: number };
export type Rgb = { r: number; g: number; b: number };

export function hsl(h: number, s: number, l: number): Hsl {
  return { h: wrap(h, 0, 360), s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
}

export function hslString({ h, s, l }: Hsl, alpha = 1): string {
  return `hsl(${h.toFixed(2)} ${(s * 100).toFixed(2)}% ${(l * 100).toFixed(2)}% / ${clamp(alpha, 0, 1)})`;
}

// HSL -> RGB per https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: f(0), g: f(8), b: f(4) };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const c = (v: number): string =>
    Math.round(clamp(v, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function shift(base: Hsl, dh = 0, ds = 0, dl = 0): Hsl {
  return hsl(base.h + dh, base.s + ds, base.l + dl);
}
