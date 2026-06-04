# Notices

Attribution log for everything in this repo that came from somewhere else.

## How to add an entry

When you build an app or add a dependency, append to the relevant section. Keep entries terse — full discussion goes in the app's README.

Templates:

### App attribution

```markdown
### <slug>

- Inspired by: <Author>, "<Title>", <URL>
- License: <SPDX / CC code>
- Adapted code from: <Author>, <URL>, <license> (optional)
- Original / inspired-only: yes | no
```

### Dataset

```markdown
### <dataset slug>

- Source: <Org>, "<Title>", <URL>
- License: <SPDX / CC code>
- Snapshot date: <YYYY-MM-DD>
- Required attribution: <verbatim string>
```

### Dependency

```markdown
- <pkg-name> @ <range> — <SPDX> — <one-line purpose>
```

---

## Dependencies

Runtime + dev dependencies vetted against the [`CONVENTIONS.md`](./docs/creative-coding/CONVENTIONS.md) checklist.

- next @ ^16 — MIT — framework
- react / react-dom @ ^19 — MIT — UI runtime
- tailwindcss @ ^4 — MIT — styling
- @tailwindcss/postcss @ ^4 — MIT — postcss plugin
- typescript @ ^5 — Apache-2.0 — type checker
- eslint @ ^9 — MIT — linter
- eslint-config-next @ ^16 — MIT — Next.js lint preset
- prettier @ ^3 — MIT — formatter
- vitest @ ^2 — MIT — test runner
- @vitejs/plugin-react @ ^4 — MIT — Vite React plugin
- @testing-library/react @ ^16 — MIT — DOM testing helpers
- @testing-library/jest-dom @ ^6 — MIT — matchers
- jsdom @ ^25 — MIT — DOM in Node
- fast-check @ ^3 — MIT — property-based testing
- husky @ ^9 — MIT — git hooks
- gsap @ ^3 — Standard "No Charge" GreenSock License (paid-gig-safe) — animation/easing/timeline
- two.js @ ^0.8 — MIT — SVG/Canvas vector renderer
- ogl @ ^1 — MIT — minimal WebGL helper
- shadcn / @base-ui/react — MIT — UI component primitives (Card, Badge, Button)
- class-variance-authority @ ^0.7 — Apache-2.0 — variant styling
- clsx @ ^2 — MIT — className builder
- tailwind-merge @ ^3 — MIT — Tailwind class merge
- lucide-react @ ^1 — ISC — icon set
- tw-animate-css @ ^1 — MIT — Tailwind animation utilities

## Adaptations

(none yet)

## Datasets

(none yet)
