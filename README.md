# creative-coding-library

A scheduled creative-coding learning lab. Two agents (a curator and a builder) take turns finding ideas, building small apps, and shipping them to new routes. Each app is a stand-alone page that teaches one concept cleanly.

## What you'll see here

- A growing catalog of small interactive apps, each at its own URL.
- A coverage map: concepts the lab has touched vs. concepts still to cover.
- Two playbooks (creative coding + data viz) that the agents follow each run.

## Quick start

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm registry     # regenerate the catalog after adding/editing an app.meta.ts
pnpm test         # vitest
pnpm build        # next build
```

## How it works

- Apps live under `src/app/<slug>/`. Each one exports a typed `meta` record in `app.meta.ts`.
- `scripts/build-app-registry.mjs` globs those, generates `src/lib/creative/registry.generated.ts`, and the home + `/creative` catalog page read from it.
- The aggregator never gets hand-edited. Two parallel app PRs never touch the same file.
- Shared helpers (math, color, seeded random, value/Perlin noise, an animation-frame hook) live in `src/lib/creative/`.

## How to add an app by hand

1. Make a folder: `src/app/<slug>/`.
2. Add `page.tsx` and `app.meta.ts` (use `defineApp({ ... })` from `@/lib/creative/registry`).
3. Run `pnpm registry`.
4. Visit `/` and `/creative`. Your app should be listed.

## How the schedules run

See [`docs/creative-coding/TRIGGER-PROMPT.md`](./docs/creative-coding/TRIGGER-PROMPT.md) and [`docs/data-viz/TRIGGER-PROMPT.md`](./docs/data-viz/TRIGGER-PROMPT.md) for paste-ready prompts for Claude Code on the web (https://code.claude.com/docs/en/claude-code-on-the-web). One curator schedule files `app-idea` GitHub issues. One builder schedule picks issues up and ships PRs that auto-merge on green CI.

## The docs

- [`docs/creative-coding/KNOWLEDGE-MAP.md`](./docs/creative-coding/KNOWLEDGE-MAP.md) — the concept tree + coverage
- [`docs/creative-coding/PLAYBOOK.md`](./docs/creative-coding/PLAYBOOK.md) — what the builder does
- [`docs/creative-coding/CURATION.md`](./docs/creative-coding/CURATION.md) — what the curator does
- [`docs/creative-coding/SOURCES.md`](./docs/creative-coding/SOURCES.md) — where ideas + code come from
- [`docs/creative-coding/LICENSING.md`](./docs/creative-coding/LICENSING.md) — license decision table
- [`docs/creative-coding/CONVENTIONS.md`](./docs/creative-coding/CONVENTIONS.md) — the gold-standard app shape
- [`docs/creative-coding/ROADMAP.md`](./docs/creative-coding/ROADMAP.md) — L1 → L2 → L3 curriculum
- [`docs/data-viz/`](./docs/data-viz/) — the sibling bundle for data-viz apps
- [`NOTICES.md`](./NOTICES.md) — attribution log + dependency list

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict + `noUncheckedIndexedAccess`), Tailwind 4, Vitest, pnpm.
