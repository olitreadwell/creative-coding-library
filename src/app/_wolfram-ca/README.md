# Elementary Cellular Automata

## What it is

An interactive Wolfram elementary cellular automaton renderer built on an HTML canvas. A single centered cell seeds the top row. Each successive row is computed by applying a Wolfram rule: a lookup that maps every 3-cell neighborhood to a new cell state. 256 rules are possible; each one is a small universe with its own visual character.

## Why this concept matters

Wolfram elementary CAs are a foundational example of emergence: local rules producing global structure. Rule 90 (XOR of neighbors) generates the Sierpinski triangle from a single cell. Rule 30 is so unpredictable it served as a pseudorandom number generator in Mathematica for decades. Rule 110 is Turing-complete. That range of behavior, from trivial to computationally universal, comes from a single bit flip in an 8-bit integer.

## Annotated key code

**Rule lookup (`elementary.ts`)**

```ts
const neighborhood = (left << 2) | (center << 1) | right;
out[i] = (rule >> neighborhood) & 1;
```

The three-cell neighborhood becomes a 3-bit index (0-7). Shifting the rule number right by that index and masking the lowest bit gives the next cell state. No conditionals needed: the entire truth table is encoded in one byte.

**Wraparound boundary**

```ts
const left = row[(i - 1 + len) % len];
const right = row[(i + 1) % len];
```

Edges wrap so the leftmost cell sees the rightmost as its left neighbor. This avoids edge artifacts and keeps the grid toroidal.

## Attribution

Elementary cellular automaton framework by Stephen Wolfram. Reference: [Wikipedia: Elementary cellular automaton](https://en.wikipedia.org/wiki/Elementary_cellular_automaton). This implementation is original code, MIT licensed.
