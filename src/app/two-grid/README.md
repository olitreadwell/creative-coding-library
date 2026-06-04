## What it is

A 10x10 grid of SVG rectangles, each rotating and pulsing in scale and hue based on its distance from the grid center, driven by two.js.

## Why this concept matters

Vector graphics (SVG) stay sharp at any resolution because they are defined by math, not pixels. Animating many shapes independently via a scene graph teaches you how to think about per-object state vs. shared time, which is a core skill for generative and data-driven graphics.

## Annotated key code

```ts
// Dynamic import keeps two.js (which reads window) out of the SSR pass.
const Two = (await import("two.js")).default;

// fit:true makes the SVG fill its container div automatically.
const two = new Two({ fitted: true, autostart: false }).appendTo(containerEl);

// Each shape is created at its grid position.
const rect = two.makeRectangle(x, y, SHAPE_SIZE, SHAPE_SIZE);
rect.fill = hslString(hsl(baseHue, 0.7, 0.55)); // shared-lib color helper
rect.noStroke();

// two.bind registers a callback that two.js calls every animation frame.
two.bind("update", () => {
  frame += 1;
  const t = frame * 0.018; // convert frame count to radians

  for (const { rect, distance, baseHue } of shapes) {
    rect.rotation += 0.008 + distance * 0.014; // outer cells spin faster

    const s = pulseScale(distance, t); // wave travels outward from center
    rect.scale = s;

    const hueShift = Math.sin(t - distance * TAU * 0.5) * 20;
    rect.fill = hslString(hsl(baseHue + hueShift, 0.75, map(s, 0.5, 1.2, 0.4, 0.7)));
  }
});

two.play(); // starts the internal RAF loop

// Cleanup: stop the loop, remove all shapes, clear the DOM node.
two.pause();
two.clear();
containerEl.innerHTML = "";
```

## Attribution

- Library: [two.js](https://two.js.org/) by Jono Brandel, MIT license.
- Animation technique inspired by the two.js official examples gallery.
