# Contributing

This guide is for anyone who wants to add a new sketch to the library. You do not need to be an expert in generative art. If you can write TypeScript and React, you can ship a sketch. This file walks you through every step, from creating the folder to opening a pull request.

## Before you start

You need Node.js (v20 or later), pnpm (v9 or later), and a basic understanding of Git branches. Clone the repo, run `pnpm install`, then run `pnpm dev` and confirm you can see the site at `http://localhost:3000`. That is all you need to begin.

## Add a new sketch in 7 steps

1. Create a branch: `git checkout -b app/<slug> dev` (replace `<slug>` with your sketch name in kebab-case, ASCII only, for example `noise-field`).
2. Create the folder: `mkdir -p src/app/<slug>`.
3. Write `src/app/<slug>/app.meta.ts` (see the template in [The meta file](#the-meta-file) below).
4. Write `src/app/<slug>/page.tsx` (see the template in [Wire the learning pieces](#wire-the-learning-pieces) below).
5. Write `src/app/<slug>/overview.mdx` (one paragraph: what the sketch does and why the concept matters).
6. Write `src/app/<slug>/tutorial.mdx` (short walkthrough: the key code explained step by step).
7. Run `pnpm registry` to register your sketch, then run `pnpm dev` and visit `/<slug>` to confirm it loads.

## Folder shape

```
src/app/<slug>/
  app.meta.ts      exports the typed meta record; read by the registry script
  page.tsx         the Next.js route; renders AppDetail with your MDX and learning components
  play/
    page.tsx       the bare canvas page; AppDetail iframes this URL
  overview.mdx     "About" tab content: what it is and why the concept matters
  tutorial.mdx     "How it works" tab content: annotated key code
  README.md        attribution block (required; see LICENSING.md template)
  components/      local React components; promote to src/lib/creative/ on the third reuse
```

The `<slug>` becomes the URL path: `/noise-field` for `src/app/noise-field/`.

## The meta file

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
    author: "Daniel Shiffman",
    title: "Flow Fields",
    url: "https://thecodingtrain.com/challenges/24-perlin-noise-flow-field",
    license: "MIT",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-06",
  prereqs: ["random-walker"],
  understandWhen: "You can change the noise scale and predict how particle paths will change.",
  predictPrompt: "What happens to the particle trails if you double the noise scale?",
  recallChecks: [
    {
      q: "What does Perlin noise give you that Math.random() does not?",
      a: "Smooth, continuous values: adjacent calls return similar numbers, so motion looks organic rather than jittery.",
    },
  ],
});
```

Field reference:

- `slug`: kebab-case string matching the folder name. This becomes the URL.
- `title`: display name shown in the catalog and page header.
- `description`: one sentence, plain language, no jargon.
- `library`: the rendering API you use, for example `"Canvas 2D"`, `"WebGL"`, `"Three.js"`.
- `concepts`: string array of topic tags shown as badges.
- `level`: `1` (beginner), `2` (intermediate), or `3` (advanced).
- `technique`: brief phrase describing the core algorithm or approach.
- `source`: optional block crediting the upstream work; required when you adapt existing code.
- `license`: the SPDX identifier for your sketch's own license, for example `"MIT"`.
- `commercialUse`: `"paid-gig-safe"` or `"personal-only"`. Read [LICENSING.md](docs/creative-coding/LICENSING.md) to decide.
- `kind`: `"creative"` for generative art; `"data-viz"` for data visualizations.
- `builtAt`: ISO 8601 date string, for example `"2026-06-06"`.
- `prereqs`: optional array of slugs the learner should master before this sketch unlocks.
- `understandWhen`: one sentence finishing "You understand this sketch when...". This is the mastery criterion shown to the learner.
- `predictPrompt`: one question shown above the live demo. Ask learners to predict an outcome before they see it run.
- `recallChecks`: array of `{ q, a }` objects. Each `q` is a question; each `a` is the answer the learner reveals by clicking a button.

## Wire the learning pieces

`AppDetail` renders the full sketch page. Pass your MDX files as `synopsis` and `tutorial`. Pass `PredictPrompt` and `RecallCheck` into the `predict` and `recall` slot props.

```tsx
import { AppDetail } from "@/components/app-detail";
import { PredictPrompt } from "@/components/learning/PredictPrompt";
import { RecallCheck } from "@/components/learning/RecallCheck";
import { meta } from "./app.meta";
import Overview from "./overview.mdx";
import Tutorial from "./tutorial.mdx";

export const metadata = {
  title: `${meta.title} — creative-coding-library`,
  description: meta.description,
};

export default function NoiseFieldPage() {
  return (
    <AppDetail
      meta={meta}
      synopsis={<Overview />}
      tutorial={<Tutorial />}
      predict={meta.predictPrompt ? <PredictPrompt prompt={meta.predictPrompt} /> : undefined}
      recall={
        meta.recallChecks && meta.recallChecks.length > 0 ? (
          <RecallCheck checks={meta.recallChecks} />
        ) : undefined
      }
    />
  );
}
```

`PredictPrompt` takes a `prompt` string and an optional `reveal` string. If you omit `reveal`, clicking the button shows nothing; pass a short answer string if you want one.

`RecallCheck` takes an array of `{ q: string; a: string }` objects drawn directly from `meta.recallChecks`. Learners see the question, click "Show answer", and see the answer.

## Verify locally

Run this command before pushing:

```sh
pnpm registry && pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build
```

The pre-push hook runs the same sequence automatically. If any step fails, fix it before pushing. Do not use `--no-verify`.

## Open a PR

Use [Conventional Commits](https://www.conventionalcommits.org/) for your commit message:

```
feat: add noise-field perlin flow field sketch
```

Rules:

- One sketch per PR. Do not bundle two sketches into one branch.
- Keep the commit subject under 72 characters, present tense, no period.
- Do not add `Co-Authored-By` lines.
- Do not use `--no-verify`.
- Target the `dev` branch, not `main`.

## Style and language

All code in this project follows the rules in [CLAUDE.md](CLAUDE.md). The two most common failures in review:

No em dashes. Use commas, parentheses, or colons instead.

Banned words: delve, intricate, tapestry, pivotal, underscore (metaphorically), landscape (metaphorically), foster, testament, enhance, crucial, multifaceted, synergy, juxtapose, epitomise, encapsulate, burgeoning. These words appear in MDX prose, README files, and meta descriptions. Search your text before submitting.

TypeScript is strict with `noUncheckedIndexedAccess`. Handle the undefined cases; do not suppress errors with `@ts-expect-error`.

## When you get stuck

Start with [docs/creative-coding/CONVENTIONS.md](docs/creative-coding/CONVENTIONS.md) for the full folder shape spec and React patterns (canvas sizing, reduced-motion, cleanup). Read [docs/creative-coding/LICENSING.md](docs/creative-coding/LICENSING.md) before setting `commercialUse` to `paid-gig-safe` on a sketch adapted from external code. Read [scripts/build-app-registry.mjs](scripts/build-app-registry.mjs) if `pnpm registry` produces unexpected output: it scans `src/app/` for folders that contain `app.meta.ts` and generates `src/lib/creative/registry.generated.ts`. Never edit that generated file by hand.
