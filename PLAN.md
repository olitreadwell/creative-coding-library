# Plan: Bootstrap `creative-coding-library` — a scheduled creative-coding _learning_ lab

## Context (the vision)

Goal: scheduled task(s) that repeatedly **find a creative-coding idea, build a small app from it, and ship it to a new route**, growing a catalog the user **plays with and learns from**.

- **Primary = a personal learning curriculum (breadth → depth), driven by a "tree of knowledge."** Creative coding's cross-cutting topics (coordinate systems/transforms, vectors/trig, animation/easing, randomness/noise, color, generative & particle systems, physics, recursion/fractals, cellular automata, shader/GPU pipeline, 3D math, audio analysis, **interaction modalities** — pointer/touch/webcam/MIDI/audio-in). Libraries are _vehicles_; concepts overlap, and that overlap map is the planning artifact. Start broad with **high-quality, non-overlapping basic-but-cool** apps, then **combine** into harder ones.
- **Iterative, user-in-the-loop, but not gated on the user.** Coverage of the tree is tracked; apps build understanding over time; the user's own ideas can enter and steer, but builds don't require interaction.
- **Parallel, non-blocking batches** ("off in a corner") via Phase-0 abstractions that keep apps DRY and independent — most importantly conflict-free registration.
- **Commercial-friendly by default, trending-first.** Prefer permissive/commercial-OK sources (MIT/Apache/BSD/ISC/CC0/CC-BY/GSAP-free) so apps are reusable in **paid VJ work**; CC-BY-NC(-SA) pools (OpenProcessing/Shadertoy defaults) are opt-in, personal-only, tagged. **Trending feeds pick the idea; the license gate picks how it's built** — NC/encumbered source → build **original** inspired code + attribute. Classics (Nature of Code, MDN) are reference/fallback.
- **VJ-ing & data-viz are secondary lenses** for now (deeper nodes: audio-reactivity, webcam, pointer interaction, open-data viz); a VJ "toolkit" accretes naturally.
- **Operational settings (user-chosen):**
  - **Merge:** auto-merge after CI (green → merge → auto-deploy live); PRs carry preview deploys.
  - **Cadence:** a few times/week, batch of **1–2 apps** per build run.
  - **Idea intake = GitHub `app-idea` issues (canonical).** Two streams: user-filed, and an AI **curator** run that researches trending sources + knowledge-tree gaps and files **cataloged, deduped** issues. User review is **advisory** (thumbs/priority/close), not a gate; the **builder** run autonomously selects open issues, builds, and closes/links them. Optional `IDEAS.md` is only an auto-generated digest.
  - **Dependency vetting:** permissive **AND** actively maintained (~>=1k–5k stars, commits/merged PRs in last ~3 months), recorded in `NOTICES.md`, loaded via dynamic import.

## What the bootstrap delivers

### 0. Project skeleton (tooling parity with scratchpad's proven setup)

Fresh Next.js 16 + React 19 + TypeScript (strict) + Tailwind 4 + pnpm project: `package.json` (scripts: dev/build/lint/typecheck/test/format + a **`registry`** codegen script), `tsconfig.json` (`@/*`->`src/*`, strict), `eslint.config.mjs`, `.prettierrc.json`, `vitest.config.ts` (+ `vitest.setup.ts`), `.husky/pre-push`, `.gitignore`, `next.config.ts`, Tailwind/PostCSS, a root `layout.tsx` + `globals.css`, and **`.github/workflows/ci.yml`** (lint -> typecheck -> format:check -> test -> build). Tests use **Vitest**.

### 1. Conflict-free app registration (built fresh) + home/catalog

- **`app.meta.ts` per app** exporting one typed record: `slug, title, description, library, concepts[], level (1|2|3), technique, source{author,title,url,license}, license, commercialUse ("paid-gig-safe"|"personal-only"), kind ("creative"|"data-viz"), builtAt`.
- **`scripts/build-app-registry.mjs`** globs `src/app/*/app.meta.ts` -> generated aggregate, wired before dev/build/lint/typecheck/test (so two parallel app PRs only ever touch their own folder; the aggregate is machine-regenerated, never hand-merged).
- **Home `/` + catalog `/creative`** page reading the aggregate: lists apps by `library / concepts / level / commercialUse` so the user browses the catalog and watches the knowledge tree fill in.

### 2. `src/lib/creative/` package seed

Proactive Phase-0 slices, each typed + commented + unit-tested (`fast-check` where natural): `useAnimationFrame` (reduced-motion aware, pause-on-hidden, cleanup), `random` (seeded PRNG), `noise` (value/Perlin), `math` (lerp/map/clamp...), `color` (HSL helpers), plus the registry **types + aggregator + test**. Coverage gate stays light initially; revisit as it grows (rule-of-three extraction thereafter).

### 3. `docs/creative-coding/` bundle

- **`KNOWLEDGE-MAP.md`** — the tree: topics + sub-concepts + which libraries embody each (overlap) + a **coverage checklist** (covered/in-progress/gap) the roadmap pulls the next gap from.
- **`PLAYBOOK.md`** (the **builder**, batch-capable): 1) pick target(s) from open `app-idea` issues (rank by user signals then gap value; dedup vs registry; non-overlapping for a batch; fall back to next map gap; close/link issue on build) -> 2) license + dependency gate -> 3) build each app in its own git worktree/branch per CONVENTIONS (reuse `src/lib/creative`, don't re-implement) + its `app.meta.ts` -> 4) test at layers -> 5) per-app `README.md` + attribution + `NOTICES.md` -> 6) `pnpm registry && lint && typecheck && format && test && build` -> 7) one PR per app, auto-merge on green.
- **`CURATION.md`** (the **curator**): research trending sources + scan tree gaps -> open **cataloged, deduped** `app-idea` issues (no builds). Defines the **issue-label taxonomy** (`app-idea`, `kind:*`, `level:*`, `library:*`, `license:*`, `priority:*`, `ai-proposed`|`user`).
- **`SOURCES.md`** — by role, trending-first: A trending feeds (pick idea), B permissive code to adapt (default), C reference/fallback, D personal-only opt-in (NC), E avoid; default rule prefer B else build original, reach D only on purpose.
- **`LICENSING.md`** — license decision table + standardized attribution template.
- **`CONVENTIONS.md`** — gold-standard app shape (skeleton, not a live route): folder layout, React/Next patterns (`'use client'`, `dynamic({ssr:false})` for canvas/WebGL, rAF cleanup, DPR/resize), the **package-extraction rule**, plus defaults: consistent **chrome** (back-to-home, title, controls, attribution footer), **safety** (reduced-motion, no strobe), **README depth** (plain-language what/why + annotated key code, ESL-friendly), **dependency-vetting checklist**.
- **`ROADMAP.md`** — derived from KNOWLEDGE-MAP; leveled curriculum: L1 basic non-overlapping (GSAP / Canvas 2D noise-field / SVG-vector two.js / GLSL shader), L2 new domains (three.js/R3F / matter.js / Web Audio / d3/Observable Plot), L3 multi-library combos (audio-reactive 3D, shader+GSAP uniforms, physics+trails, audio+generative+fullscreen). Covers fractals, CA, particles, typography, RNG, easing, color, interaction modalities along the way.
- **`TRIGGER-PROMPT.md`** — **two** paste-ready web-schedule prompts: a **curator** (-> CURATION.md) and a **builder** (-> PLAYBOOK.md, batch 1–2, a few times/week), plus the one-time **GitHub repo settings** to enable (Settings -> "Allow auto-merge" + branch protection requiring the `ci` check) and a link to code.claude.com/docs/en/claude-code-on-the-web for creating the schedules.

### 4. `docs/data-viz/` — FULL sibling playbook (secondary priority, scaffolded now)

Mirror of the creative-coding bundle for an open-data -> viz generator: PLAYBOOK, SOURCES (data.gov, Our World in Data CC-BY, World Bank/Eurostat, Kaggle CC0/CC-BY, Awesome Public Datasets; commercial-first; flag ODbL/NC as opt-in), LICENSING (dataset-license table), CONVENTIONS (fetch/cache, typed+validated schema, accessible non-color-alone charts), ROADMAP (data-shape->viz pairings; d3/Visx/Observable Plot), TRIGGER-PROMPT. Shares the `app.meta.ts` schema (`kind:"data-viz"` + future `dataset{}` field), `NOTICES.md`, license model, conventions, CI, and the same `app-idea` issue backlog.

### 5. Repo meta

- **`NOTICES.md`** — attribution template + empty "Adaptations" section (also logs vetted deps + licenses).
- **`.github/ISSUE_TEMPLATE/app-idea.md`** + label definitions for the curator/builder taxonomy.
- **`README.md`** — what the lab is, how the curriculum/registry/playbooks work, and the catalog link.
- **`CLAUDE.md` / `AGENTS.md`** — project instructions: the registration convention (`app.meta.ts` + `pnpm registry`), phasing/parallel model, pointers to the playbooks; Vitest (not node --test).

## Verification (in the new repo)

- `pnpm install` then `pnpm registry && pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build` all green; `src/lib/creative` + registry tests pass; `/` and `/creative` render.
- Dry-read PLAYBOOK + CURATION end-to-end against real files/commands; confirm two parallel apps touch only their own `app.meta.ts` + folder; confirm both TRIGGER prompts are self-contained.

## Ship

Initial commit on the default branch (or a `bootstrap` branch + PR), then push. Configure GitHub auto-merge + branch protection (or document it in TRIGGER-PROMPT.md). Connect Vercel for its own deploys. Then create the two web schedules (curator + builder) from TRIGGER-PROMPT.md.
