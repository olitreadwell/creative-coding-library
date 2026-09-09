# creative-coding-library

30 generative-art sketches. Built to be broken.

Each sketch teaches one concept. You predict what it does, run it, break it, fix it, then say what you learned. The home page orders sketches by what you need to know first, so you build up knowledge one step at a time.

## For learners

Open the site at the Journey view (it's the default). Start with sketches that have no locked prerequisites. Each sketch has a predict prompt, a live demo, and a "mark as understood" button. When you mark one done, the next ones unlock.

The Catalog view shows all sketches with search and filters. Use it when you want to browse or find something specific.

## For contributors

- Each sketch lives in `src/app/<slug>/`. It exports a typed `meta` record in `app.meta.ts`.
- `scripts/build-app-registry.mjs` reads those files and generates `src/lib/creative/registry.generated.ts`. The home page reads from that file.
- Never edit the generated file by hand. Two sketch PRs can run in parallel because each one only touches its own `<slug>/` folder.
- Shared helpers (math, color, seeded random, noise, an animation-frame hook) live in `src/lib/creative/`. Use these before writing your own.

## Quick start

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm registry     # regenerate the catalog after adding/editing an app.meta.ts
pnpm test         # vitest
pnpm build        # next build
```

## How to add a sketch

1. Create a folder: `src/app/<slug>/`.
2. Add `page.tsx` and `app.meta.ts` (use `defineApp({ ... })` from `@/lib/creative/registry`).
3. Run `pnpm registry`.
4. Visit `/`. Your sketch appears in both Journey and Catalog views.

See [`docs/creative-coding/CONVENTIONS.md`](./docs/creative-coding/CONVENTIONS.md) for the full app shape spec. Read [`docs/creative-coding/LICENSING.md`](./docs/creative-coding/LICENSING.md) before copying any upstream source.

## Parallel work

One worktree per sketch: `git worktree add ../wt-<slug> -b app/<slug> dev`. The registry script regenerates on each worktree, so no merge conflict ever touches the catalog.

## Docs

- [`docs/creative-coding/KNOWLEDGE-MAP.md`](./docs/creative-coding/KNOWLEDGE-MAP.md) — concept tree and coverage map
- [`docs/creative-coding/PLAYBOOK.md`](./docs/creative-coding/PLAYBOOK.md) — builder playbook
- [`docs/creative-coding/CURATION.md`](./docs/creative-coding/CURATION.md) — curator playbook
- [`docs/creative-coding/SOURCES.md`](./docs/creative-coding/SOURCES.md) — where ideas and code come from
- [`docs/creative-coding/ROADMAP.md`](./docs/creative-coding/ROADMAP.md) — L1 to L3 curriculum
- [`docs/data-viz/`](./docs/data-viz/) — data-viz sibling bundle
- [`NOTICES.md`](./NOTICES.md) — attribution log and dependency list

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict + `noUncheckedIndexedAccess`), Tailwind 4, Vitest, pnpm.
