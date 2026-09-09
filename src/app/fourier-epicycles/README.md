# Fourier Epicycles

## What it is

An animated chain of rotating circles whose combined tip traces a square wave. Each circle is one Fourier harmonic: a specific frequency, amplitude, and starting phase. The first circle is large and slow. Each successive circle is smaller and spins faster. Together they approximate the sharp corners of a square wave using only smooth circular motion. A Reset button clears the traced path. Both dark and light themes are supported with AA-contrast color choices.

## Why this concept matters

The Fourier series is one of the most widely applied ideas in mathematics. It says that any periodic signal can be written as a sum of sines and cosines at different frequencies. The epicycle animation makes that abstract fact concrete: you can see the individual circles, watch them spin at different rates, and observe the traced path assemble the target shape frame by frame. The same principle underlies audio compression, image processing, radio transmission, and medical imaging.

## Annotated key code

**Summing rotating vectors (`epicycles.ts`)**

```ts
for (const term of terms) {
  const angle = term.freq * TAU * t + term.phase;
  x += term.amp * Math.cos(angle);
  y += term.amp * Math.sin(angle);
}
```

Each term rotates at `freq` full turns per cycle. `TAU * t` converts normalized time to radians. Summing cosine and sine components is the same as summing 2D vectors that rotate in the complex plane.

**Square-wave term generation (`epicycles.ts`)**

```ts
const harmonic = 2 * k + 1; // 1, 3, 5, 7, ...
terms.push({ freq: harmonic, amp: (4 / Math.PI) * (1 / harmonic), phase: -Math.PI / 2 });
```

The `4 / (pi * harmonic)` amplitude is the exact Fourier coefficient for a square wave. The phase offset rotates the series so the arm starts horizontal at `t=0`.

**DPR-aware canvas sizing (`play/page.tsx`)**

```ts
canvas.width = Math.round(cssW * window.devicePixelRatio);
canvas.height = Math.round(cssH * window.devicePixelRatio);
```

Physical pixel dimensions are set explicitly so the canvas stays sharp on Retina and high-DPI screens. A ResizeObserver keeps it in sync with layout changes.

## Attribution

Fourier series described by Joseph Fourier, 1807.
Reference: [Wikipedia: Fourier series](https://en.wikipedia.org/wiki/Fourier_series).
Square-wave coefficients from standard Fourier analysis literature.
This implementation is original code, MIT licensed.
