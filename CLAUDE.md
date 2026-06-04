# creative-coding-library — agent context

You are working in a scheduled creative-coding learning lab. Read this file first. Read the playbook for whichever role you're running.

## Roles

- **Curator** — finds ideas, opens `app-idea` issues, never writes code. See [`docs/creative-coding/CURATION.md`](./docs/creative-coding/CURATION.md).
- **Builder** — picks open issues, builds apps, ships PRs. See [`docs/creative-coding/PLAYBOOK.md`](./docs/creative-coding/PLAYBOOK.md).
- **Data-viz curator / builder** — same loop, data-viz lens. See [`docs/data-viz/`](./docs/data-viz/).

If the human is driving (not a scheduled run), follow the request directly but still respect the registration convention below.

## Registration convention (non-negotiable)

Every app lives at `src/app/<slug>/` and exports `meta` from `<slug>/app.meta.ts` using `defineApp({ ... })` from `@/lib/creative/registry`.

`scripts/build-app-registry.mjs` generates `src/lib/creative/registry.generated.ts` from those metas. **Never hand-edit the generated file.** Run `pnpm registry` after creating or editing any `app.meta.ts`. The pre-{dev,build,lint,typecheck,test} hooks already do this for you in dev; but agents should run it explicitly before reasoning about the catalog.

This convention is what makes parallel app PRs safe: two PRs only touch their own `<slug>/` folder + `app.meta.ts`, never the aggregate.

## Shared lib

`src/lib/creative/` contains: `math`, `color`, `random` (seeded PRNG), `noise` (value + Perlin), `useAnimationFrame` (reduced-motion-aware, pause-on-hidden), and the registry types. **Use these.** Don't re-implement.

Promotion rule: if you write a helper inline and find yourself wanting it a third time, extract it into `src/lib/creative/`. Two reuses inline is fine.

## Verification

The pre-push hook and CI both run:

```sh
pnpm registry && pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build
```

If any of these fail, stop and fix. No `--no-verify`, no `eslint-disable`-the-file, no `// @ts-expect-error`.

## Tests

- **Vitest**, not `node --test`. Run with `pnpm test`.
- Use `fast-check` for property-based testing where it's natural (numeric helpers, random, noise).
- Unit tests live next to the code: `foo.ts` → `foo.test.ts`.
- React component tests use `@testing-library/react` + jsdom (already configured in `vitest.config.ts`).

## Style

- TypeScript strict + `noUncheckedIndexedAccess`. Handle the undefined cases.
- No em dashes in prose.
- No banned words: delve, intricate, tapestry, pivotal, underscore, landscape, foster, testament, enhance, crucial, multifaceted, synergy, juxtapose, epitomise, encapsulate, burgeoning.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`), under 72 chars, present tense, no period. No `Co-Authored-By` lines.
- Default to no comments. Only add a comment when the _why_ would surprise a reader.

## Parallel work

- One worktree per app: `git worktree add ../wt-<slug> -b app/<slug> main`.
- The build script regenerates `registry.generated.ts` on each worktree, so no merge conflict can arise from the catalog.

## When in doubt

Read [`docs/creative-coding/CONVENTIONS.md`](./docs/creative-coding/CONVENTIONS.md) before adding files. Read [`docs/creative-coding/LICENSING.md`](./docs/creative-coding/LICENSING.md) before adding a dependency or copying a source.
