# L-System Tree

## What it is

A fractal plant drawn on an HTML canvas using an L-system and turtle graphics.
An L-system is a formal grammar: you start with a short string (the axiom) and
repeatedly replace each symbol with a longer string (the rule). After several
rounds of expansion you get a string thousands of characters long. A turtle then
reads that string and walks across the canvas, drawing a branch whenever it sees
`F`, turning left or right for `+` and `-`, and saving/restoring its position
for `[` and `]`.

The axiom used here is `X` with the rules:

```
X -> F+[[X]-X]-F[-FX]+X
F -> FF
```

Five iterations produce a full plant in roughly 30 ms.

## Why this concept matters

L-systems were invented by biologist Aristid Lindenmayer in 1968 to model plant
growth mathematically. The same substitution idea now appears in procedural
generation, circuit board routing, and fractal compression. Understanding how a
short ruleset produces complex self-similar structure is a gateway to generative
design at scale.

The bracketed variant (`[` and `]`) is the key insight: the turtle keeps a stack
of saved positions, so it can explore a branch and snap back to the fork point
exactly, mirroring how real plants branch off a common stem.

## Annotated key code

```ts
// lsystem.ts — pure, no DOM

export function expand(axiom: string, rules: Record<string, string>, iterations: number): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (let c = 0; c < current.length; c++) {
      const ch = current[c] ?? "";
      // If the symbol has a rule, replace it; otherwise keep it unchanged.
      next += Object.prototype.hasOwnProperty.call(rules, ch) ? (rules[ch] ?? ch) : ch;
    }
    current = next;
  }
  return current;
}

export function turtleSegments(commands: string, config: TurtleConfig): Segment[] {
  const stack: TurtleState[] = [];
  // '[' pushes current position + angle + depth onto the stack.
  // ']' pops it, teleporting the turtle back to the fork point.
  // depth increments on push so we can taper width and shift color at tips.
}
```

In `page.tsx`, a `ResizeObserver` watches the canvas element. When the window
resizes it updates a `CanvasSize` state value; a `useEffect` depending on
`[seed, iterations, size]` re-runs `drawTree`, so the plant always fills the
available space.

Line width and color are mapped from trunk (warm brown, thick) to tip (green,
thin) based on the segment's nesting depth.

## Attribution

Concept and grammar from Aristid Lindenmayer's 1968 paper on mathematical
models of plant growth, as described on
[Wikipedia: L-system](https://en.wikipedia.org/wiki/L-system).
Implementation: original code, MIT license.
