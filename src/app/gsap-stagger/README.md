## What it is

A 12x8 grid of colored tiles that animate in and out in a ripple wave from the center, looping forever using a GSAP timeline with grid stagger.

## Why this concept matters

Staggered animation makes a group of elements feel alive and connected, not robotic. When you tell GSAP `from: "center"` with a `grid` layout hint, it calculates each tile's distance from the center and delays its animation by that amount. The result is a wave that spreads outward without you writing any position math. This pattern appears in product launches, data dashboards, and creative portfolios whenever you want a reveal that has rhythm.

## Annotated key code

```ts
// Build a repeating timeline that plays in, pauses, then plays out.
const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });

tl.from(".stagger-tile", {
  scale: 0, // tiles grow from nothing
  opacity: 0,
  rotation: -45, // slight spin adds life to the reveal
  duration: 0.7,
  ease: "power2.inOut",
  stagger: {
    each: 0.04, // delay between each tile firing
    from: "center", // GSAP sorts tiles by distance from center
    grid: [ROWS, COLS], // tells GSAP the 2-D layout so "center" is meaningful
  },
}).to(
  ".stagger-tile",
  {
    scale: 0,
    opacity: 0,
    rotation: 45, // opposite spin on exit gives it a flip feel
    duration: 0.55,
    ease: "power2.in",
    stagger: { each: 0.03, from: "center", grid: [ROWS, COLS] },
  },
  "+=0.5", // start the exit half a second after the reveal completes
);
```

`gsap.context()` scopes all selectors to the ref'd container and `ctx.revert()` tears down every tween on unmount, so there are no memory leaks.

## Attribution

- Technique reference: [GSAP Stagger docs](https://gsap.com/docs/v3/Staggers/) by GreenSock
- Color helpers: `hsl` / `hslString` from `@/lib/creative/color` (project shared lib)
- No third-party code was copied verbatim; this implementation is original.
