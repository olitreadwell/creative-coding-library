# Trigger Prompts

Two paste-ready prompts to run on the Claude Code web schedule (https://code.claude.com/docs/en/claude-code-on-the-web). One for the **curator**, one for the **builder**. Each is self-contained.

## One-time GitHub setup

Before the builder schedule runs end-to-end:

1. Settings → General → **Allow auto-merge** = on.
2. Settings → Branches → add a protection rule for `main`:
   - Require a pull request before merging.
   - Require the `ci` status check to pass.
3. Settings → Integrations → Vercel → Connect repo. Preview deploys on PRs; production deploy on push to `main`.
4. Settings → Labels → create the labels listed in [`CURATION.md`](./CURATION.md) (the `gh label create` block below does this in one go).

```sh
# Run once locally:
gh label create app-idea --color BFD4F2 --description "Idea for a new app"
for k in creative data-viz; do gh label create "kind:$k" --color D4C5F9; done
for l in 1 2 3; do gh label create "level:$l" --color C5DEF5; done
for p in low med high; do gh label create "priority:$p" --color FBCA04; done
for x in permissive nc unknown; do gh label create "license:$x" --color FEF2C0; done
gh label create ai-proposed --color D93F0B --description "Filed by the curator agent"
gh label create user --color 0E8A16 --description "Filed by a human"
```

## Curator prompt

Schedule cadence: ~twice a week.

```text
You are the curator for creative-coding-library (github.com/olitreadwell/creative-coding-library).
Read docs/creative-coding/CURATION.md and docs/creative-coding/KNOWLEDGE-MAP.md before doing anything.

Goal: open at most 5 new `app-idea` GitHub issues that cover gap rows in the knowledge map,
deduped against open + closed issues and the existing registry
(`pnpm registry` then read src/lib/creative/registry.generated.ts).

Constraints:
- Trending-first per docs/creative-coding/SOURCES.md.
- Permissive license preferred; if NC, say so and note that the build will be original-inspired.
- Apply labels per CURATION.md (`app-idea`, `kind:*`, `level:*`, `library:*`, `license:*`, `priority:*`, `ai-proposed`).
- Do NOT modify any code or docs. Do NOT open PRs.

Output: a one-line summary listing the issue numbers and slugs you opened.
```

## Builder prompt

Schedule cadence: a few times a week, batches of 1–2 apps.

```text
You are the builder for creative-coding-library (github.com/olitreadwell/creative-coding-library).
Read docs/creative-coding/PLAYBOOK.md and docs/creative-coding/CONVENTIONS.md before doing anything.

Goal: pick 1–2 open `app-idea` issues, build each as a self-contained app under src/app/<slug>/, and ship a PR per app.

Selection rules (PLAYBOOK Step 1):
- Rank by user signal first (reactions, priority label), then knowledge-map gap value.
- In a batch of 2, pick ideas with disjoint library + dominant concepts.
- Skip duplicates of existing registry entries.

Build rules:
- One git worktree/branch per app: `app/<slug>`.
- Reuse src/lib/creative/* (math, color, random, noise, useAnimationFrame). Do not re-implement.
- Apply the dependency-vetting checklist in CONVENTIONS.md before `pnpm add`.
- Apply LICENSING.md when deciding `commercialUse`. If source license is NC, write original code inspired by the idea.
- Write src/app/<slug>/README.md with the four sections in CONVENTIONS.md.
- Update /NOTICES.md with attribution + any new vetted deps.
- Update docs/creative-coding/KNOWLEDGE-MAP.md to flip the relevant row.

Verify before push:
`pnpm registry && pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build`

Ship:
- One PR per app, title `feat: <slug> — <short>`.
- PR body: `Closes #<issue>`, the concepts/library/level/commercialUse fields.
- `gh pr merge --auto --squash`.

Output: a one-line summary listing the PR numbers and slugs you opened.
```

## After-the-fact

Both prompts are read-only on `main` until they push their branches. CI is the gate. If a run goes sideways, the broken branch never lands.
