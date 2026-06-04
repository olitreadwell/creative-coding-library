# Builder Playbook

What the **builder** run does each time it fires. The builder picks ideas, builds apps, and ships PRs. It does not curate.

## TL;DR

1. Pick 1–2 open `app-idea` issues.
2. Run the license + dependency gate.
3. For each pick: branch, scaffold, build, test, document, commit, PR.
4. Auto-merge on green CI.

## Step 1 — pick targets

Rank open `app-idea` issues by:

1. User signal: thumbs-up reactions, `priority:*` label.
2. Knowledge-map gap value: prefer `gap` rows in [`KNOWLEDGE-MAP.md`](./KNOWLEDGE-MAP.md), then `partial`.
3. Non-overlap: in a batch of 2, pick ideas with disjoint `library` + dominant `concepts[]`.
4. Dedup: scan the registry (`pnpm registry` then read `src/lib/creative/registry.generated.ts`). If a near-duplicate exists, skip and comment on the issue.

Fallback when the issue queue is empty: take the next `gap` row from the knowledge map and file an issue for it before building (so the audit trail stays clean).

## Step 2 — license + dependency gate

Per [`LICENSING.md`](./LICENSING.md):

- Source code license must be **paid-gig-safe** (permissive: MIT / Apache-2.0 / BSD / ISC / CC0) **OR** the build must be original-inspired with attribution.
- NC / SA / encumbered sources => write fresh code, attribute, mark `commercialUse: "personal-only"` only if the _idea_ is too entangled to genericize.

Per [`CONVENTIONS.md`](./CONVENTIONS.md) dependency checklist:

- Permissive license.
- Active maintenance: commits or merged PRs in last ~3 months.
- Meaningful adoption: roughly ≥1k–5k GitHub stars, multiple contributors.
- Record the dep + license in [`/NOTICES.md`](/NOTICES.md).

If any dep fails, drop it or substitute. Do not vendor sketchy packages.

## Step 3 — build per app

Each app gets its own git worktree or branch named `app/<slug>`.

```
git worktree add ../wt-<slug> -b app/<slug> main
cd ../wt-<slug>
```

Folder layout (see [`CONVENTIONS.md`](./CONVENTIONS.md) for the full skeleton):

```
src/app/<slug>/
  page.tsx          # 'use client' if interactive; dynamic({ssr:false}) for canvas/WebGL
  app.meta.ts       # registry entry (export const meta = defineApp({...}))
  components/       # local helpers (extract to src/lib/creative on third reuse)
  README.md         # what / why / annotated key code / attribution
```

Reuse `src/lib/creative/*` (math, color, random, noise, useAnimationFrame). Do not re-implement.

## Step 4 — test at layers

- **Unit**: pure helpers (math, color, generation logic). Vitest.
- **Integration**: render the page in jsdom via `@testing-library/react`; assert mount + key DOM nodes.
- **Smoke**: catalog page lists the new app after `pnpm registry`.

Add new tests only where they catch something a typecheck cannot. Do not write tests just to inflate count.

## Step 5 — per-app README + attribution

`src/app/<slug>/README.md` covers:

- One-line what it is.
- Why this concept matters (plain language, ESL-friendly).
- Annotated walk-through of the key code (~10–20 lines).
- Source + license attribution (template in [`LICENSING.md`](./LICENSING.md)).

Update [`/NOTICES.md`](/NOTICES.md) with attribution and any new vetted deps.

## Step 6 — verify

```sh
pnpm registry && pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build
```

All green or stop. No `eslint-disable`. No `// @ts-expect-error`. No `--no-verify`.

## Step 7 — ship

```sh
git add -A
git commit -m "feat: <slug> — <short>"
git push -u origin app/<slug>
gh pr create --fill --title "feat: <slug> — <short>" --body-file - <<EOF
Closes #<issue>

Concepts: <comma-separated>
Library: <library>
Level: <1|2|3>
Commercial use: <paid-gig-safe|personal-only>
EOF
gh pr merge --auto --squash
```

After CI passes, GitHub auto-merges and Vercel deploys. The schedule moves to the next batch.

## Update the knowledge map

After merge, edit [`KNOWLEDGE-MAP.md`](./KNOWLEDGE-MAP.md):

- Flip the row from `gap` / `partial` to the next stage.
- Add the slug under **Apps**.

This makes the next builder run smarter without the curator having to re-scan everything.

## Things that break the loop

- Two apps in the same batch touching the same file outside their own folder. Fix: use `src/lib/creative` instead of editing another app.
- A dep fails the vetting gate mid-build. Fix: substitute or drop.
- CI red after merge. Fix: open a `fix:` PR; never force-push main.
