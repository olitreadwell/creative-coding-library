# Data-Viz Conventions

Shape every data-viz app follows. Mirrors the creative-coding [`CONVENTIONS.md`](../creative-coding/CONVENTIONS.md) with data-specific additions.

## Folder layout

```
src/app/<slug>/
  page.tsx
  app.meta.ts
  data/
    fetch.ts         # one function that returns parsed, validated data
    schema.ts        # zod schema or hand-written type guards
    snapshot.json    # optional cached fetch result for build-time use
  components/
  README.md
```

## `app.meta.ts`

Same shape as creative-coding apps, with `kind: "data-viz"`. The dataset schema reserves a future `dataset {}` field; for now, list the source in the README.

## Fetch + cache

- **Build time**: prefer fetching during `next build` (Server Component, `fetch()` with `revalidate`, or `generateStaticParams`). Result is part of the deployed bundle. Static, fast.
- **Client time**: only for live data. Hit a thin route handler that wraps the upstream API (so the upstream key never reaches the browser).
- **Snapshot fallback**: always commit a `data/snapshot.json` so the app renders even when the upstream is down.

## Validate

Use `zod` (vetted dep) or hand-written type guards. The validator is the trust boundary:

```ts
import { z } from "zod";

export const Row = z.object({
  date: z.string(),
  value: z.number(),
});
export type Row = z.infer<typeof Row>;
```

Reject malformed rows. In dev, throw loud. In prod, log + skip + render a "data unavailable" state for the bad rows.

## Accessibility

- Provide a text summary near every chart (sr-only acceptable).
- Never encode meaning via color alone — pair with shape, label, pattern, or position.
- Use a color-blind-friendly palette by default (e.g. Plot's default scheme).
- Tooltips must be reachable by keyboard.
- All axes labeled with units.

## Viz library default

- Default: **Observable Plot** for grammar-of-graphics.
- Drop to **d3** when Plot can't express the encoding.
- Use **Visx** for React-native d3 composition.

## Dataset-vetting checklist

Before adding a dataset:

- [ ] License is `paid-gig-safe` per [`LICENSING.md`](./LICENSING.md), or app is marked `personal-only`
- [ ] Snapshot date noted
- [ ] Update cadence noted
- [ ] Required attribution string captured
- [ ] Dataset added to [`/NOTICES.md`](/NOTICES.md) under **Datasets**

## Don't

- Don't ship live API keys to the client.
- Don't fetch from the browser on every render (cache or proxy).
- Don't strip a required attribution.
- Don't manipulate axes to mislead (no truncated y-axis without disclosure).
