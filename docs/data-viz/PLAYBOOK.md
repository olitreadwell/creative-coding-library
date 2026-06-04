# Data-Viz Builder Playbook

Sibling of [`docs/creative-coding/PLAYBOOK.md`](../creative-coding/PLAYBOOK.md). Same loop, swapped for the data-viz lens.

## TL;DR

1. Pick 1–2 open `app-idea` issues with `kind:data-viz`.
2. Run the **dataset license + dataset freshness** gate (in addition to the dependency gate).
3. For each pick: branch, fetch + validate dataset, scaffold, build, test, document, commit, PR.
4. Auto-merge on green CI.

## Step 1 — pick targets

Same ranking as creative-coding: user signal, then knowledge-map gap value, then non-overlap. Use the data-viz knowledge map below + the shared `KNOWLEDGE-MAP.md` for any cross-cutting concepts (color, interaction).

## Step 2 — dataset license + freshness gate

Per [`LICENSING.md`](./LICENSING.md):

- Dataset license must allow the resulting app's `commercialUse` flag. Default `paid-gig-safe` requires CC0 / CC-BY / Public Domain / explicit commercial-OK terms.
- ODbL / CC-BY-NC datasets => `commercialUse: "personal-only"` and a prominent attribution.
- "Unknown / scraped / TOS-restricted" => skip.

Freshness:

- Prefer datasets refreshed within the last year (or annual reporting cadence).
- For static historical sets, that's fine — note the snapshot date in the README.

## Step 3 — build per app

```
src/app/<slug>/
  page.tsx
  app.meta.ts        # kind: "data-viz"; future dataset {} field
  data/              # fetcher + zod schema; optional cached JSON snapshot
  components/
  README.md
```

Fetch the data at **build time** (Next.js Server Component or `generateStaticParams`) or **client time** with a cached static snapshot. Never hit a live endpoint from every page view.

Validate with zod (or hand-written guards). Reject malformed rows loudly during dev; fall through to a clean "data unavailable" state in prod.

## Step 4 — viz layer

Default to **Observable Plot** for grammar-of-graphics fluency. Drop to **d3** when Plot can't express the encoding. Use **Visx** when you want React composition over d3 primitives.

Accessibility:

- Never encode meaning by color alone. Pair color with shape, label, or pattern.
- Provide a text summary alongside the chart (sr-only is fine).
- Tooltips reachable by keyboard.

## Step 5 — README + attribution

Same four-section README as creative-coding (what / why / annotated key code / attribution), plus a **Dataset** block:

```markdown
## Dataset

- Source: <Org Name>, "<Dataset Title>", <URL>
- License: <SPDX or CC code>
- Snapshot date: <YYYY-MM-DD>
- Update cadence: <e.g. monthly>
```

Update [`/NOTICES.md`](/NOTICES.md) under **Datasets**.

## Step 6 — verify

Same script as creative-coding:

```sh
pnpm registry && pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build
```

## Step 7 — ship

Same PR + auto-merge flow.
