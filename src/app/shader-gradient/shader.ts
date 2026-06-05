export const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform float uSpeed;
  uniform float uSeed;
  // 1.0 = light theme, 0.0 = dark theme.
  uniform float uTheme;
  // Spatial frequency multiplier: higher = more zoomed-in / finer pattern.
  uniform float uScale;
  // Contrast boost applied before output: 1.0 = unchanged, >1 = more contrast.
  uniform float uContrast;

  // Classic cosine palette by Inigo Quilez:
  // color = a + b * cos(TAU * (c * t + d))
  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  // One level of domain warp: displace the UV by a rotated sine wave before
  // sampling the palette, creating smooth organic movement.
  float warp(vec2 p, float t) {
    float a = sin(p.x * 1.2 + t * 0.7 + uSeed)
            + sin(p.y * 0.9 - t * 0.5);
    float b = sin(p.y * 1.1 + t * 0.6 + uSeed * 1.3)
            + sin(p.x * 0.8 + t * 0.4);
    return sin(a + b + t * 0.3) * 0.5 + 0.5;
  }

  void main() {
    // Normalize fragment coordinate to [-1, 1] on the long axis, then scale.
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
    uv *= uScale;

    float driven = uTime * uSpeed;

    // Two warp passes at different scales give a richer morph.
    float w1 = warp(uv,            driven);
    float w2 = warp(uv * 1.7 + 0.4, driven * 0.8);
    float t  = mix(w1, w2, 0.5);

    // Palette coefficients — three presets baked as offset seeds.
    // uSeed selects which hue region to bias toward.
    float seedFrac = fract(uSeed * 0.1);

    // Dark palette: rich, saturated, low base lightness.
    vec3 darkCol = palette(
      t,
      vec3(0.5, 0.5, 0.5),
      vec3(0.5, 0.5, 0.5),
      vec3(1.0, 1.0, 0.5),
      vec3(0.80 + seedFrac, 0.53 + seedFrac * 0.4, 0.22)
    );

    // Light palette: high base lightness, pastel-tinted, airy feel.
    // Offset phase by 0.15 so hues shift pleasantly rather than washing out.
    vec3 lightCol = palette(
      t,
      vec3(0.82, 0.80, 0.78),
      vec3(0.18, 0.16, 0.20),
      vec3(1.0, 1.0, 0.5),
      vec3(0.80 + seedFrac, 0.53 + seedFrac * 0.4, 0.37)
    );

    // Mix between dark and light palettes based on the theme uniform.
    vec3 col = mix(darkCol, lightCol, uTheme);

    // Apply contrast: pivot around 0.5, scale by uContrast, then clamp.
    col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);

    // Subtle vignette keeps edges from blowing out.
    float vignette = 1.0 - dot(uv / uScale * 0.35, uv / uScale * 0.35);
    col *= clamp(vignette, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export type PaletteLabel = "calm" | "warm" | "wild";

/**
 * Map a named palette preset to its seed number.
 * The seed shifts the cosine palette phase, producing a distinct hue region.
 *
 * @param label - one of "calm" | "warm" | "wild"
 * @returns a numeric seed in the range [0, 10)
 */
export function paletteSpeed(label: PaletteLabel): number {
  switch (label) {
    case "calm":
      return 0;
    case "warm":
      return 3.5;
    case "wild":
      return 7.2;
  }
}

/**
 * Mix three RGB color vectors with a cubic smoothstep weight.
 * Useful for blending palette anchors in CPU-side color helpers.
 *
 * @param a - first color as [r, g, b] each in [0, 1]
 * @param b - second color as [r, g, b]
 * @param c - third color as [r, g, b]
 * @param t - blend parameter in [0, 1]; 0=a, 0.5=b, 1=c
 * @returns interpolated [r, g, b] triple
 */
export function mix3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  c: readonly [number, number, number],
  t: number,
): [number, number, number] {
  const smooth = (x: number): number => x * x * (3 - 2 * x);

  if (t <= 0.5) {
    const s = smooth(t * 2);
    return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
  }
  const s = smooth((t - 0.5) * 2);
  return [b[0] + (c[0] - b[0]) * s, b[1] + (c[1] - b[1]) * s, b[2] + (c[2] - b[2]) * s];
}
