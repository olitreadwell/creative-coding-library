# Conventions

The shape every app follows. Skeleton, not a route.

## Folder layout

```
src/app/<slug>/
  page.tsx           # default export = the app's view
  app.meta.ts        # export const meta = defineApp({ ... })
  components/        # local helpers; promote to src/lib/creative on the third reuse
  README.md          # what, why, annotated key code, attribution
```

The `<slug>` is the URL: `/<slug>`. Slug = kebab-case, ASCII only.

## `app.meta.ts`

```ts
import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "noise-field",
  title: "Noise Field",
  description: "A flow field driven by Perlin noise.",
  library: "Canvas 2D",
  concepts: ["noise", "particle-system", "color"],
  level: 1,
  technique: "rAF + Perlin + additive blend",
  source: {
    author: "...",
    title: "...",
    url: "https://...",
    license: "MIT",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05",
});
```

Run `pnpm registry` after creating or editing this file. The catalog and home pages read the generated aggregate.

## React / Next patterns

- Interactive view? `'use client'` at the top.
- Canvas / WebGL / audio? Wrap the actual component in `dynamic(import, { ssr: false })` so SSR does not try to render it.
- Always `cancelAnimationFrame` and `removeEventListener` on cleanup.
- Resize the canvas to `clientWidth * devicePixelRatio` (and divide back via CSS). Use a `ResizeObserver`.
- Pause animation when the tab is hidden — use `useAnimationFrame` from `src/lib/creative`.

## Reuse, don't re-implement

Use `src/lib/creative/*` for: math, color, random, noise, animation frame. If a helper is missing and you write it twice, leave it inline. The third reuse is the trigger to extract it into `src/lib/creative` (rule of three).

## App chrome (consistent across apps)

Every app's `page.tsx` should render:

- A small header: back link to `/`, the app title.
- The canvas / interactive area.
- Controls (sliders, buttons) at the side or bottom.
- An attribution footer naming the source + license.

This makes the catalog feel coherent. Lifting these to a shared layout is OK once the third app exists.

## Safety defaults

- Honor `prefers-reduced-motion` (skip the loop, render a still frame).
- No strobing or rapid flashing.
- No infinite-volume audio; start muted by default; first play on user gesture.

## Dependency-vetting checklist

Before `pnpm add <pkg>`:

- [ ] License is permissive (see [`LICENSING.md`](./LICENSING.md))
- [ ] Last commit / merged PR within the last ~3 months
- [ ] Multiple maintainers, not solo
- [ ] Roughly ≥1k–5k GitHub stars (signal, not law)
- [ ] No transitive GPL/AGPL
- [ ] Tree-shakeable or small (< 50KB gzipped) — if heavy, dynamic-import on first paint
- [ ] Add to [`/NOTICES.md`](/NOTICES.md) **Dependencies** with SPDX identifier

If any box fails, find an alternative or write it yourself.

## README depth

Every app's README has four sections:

1. **What it is** — one sentence, plain language.
2. **Why this concept matters** — short paragraph, ESL-friendly, no jargon clusters.
3. **Annotated key code** — 10–20 lines of the most interesting code with inline comments.
4. **Attribution** — see [`LICENSING.md`](./LICENSING.md) template.

Skim-first. A reader should grok the app in 30 seconds without scrolling.

## Don't

- Don't `eslint-disable` whole files.
- Don't `// @ts-expect-error` to mute strict errors; fix the type.
- Don't edit files outside `src/app/<slug>/` and the meta. The registry is generated; never hand-edit it.
- Don't add comments that just restate the code.
- Don't write a "future improvements" section. Open an `app-idea` issue instead.
