# Licensing

How to decide whether an app can ship as **paid-gig-safe** and how to attribute sources.

## TL;DR

| Source license                                 | Build approach                                                                      | App's `commercialUse`                                          |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| MIT / Apache-2.0 / BSD / ISC / CC0 / Unlicense | Adapt freely, attribute                                                             | `paid-gig-safe`                                                |
| CC-BY                                          | Adapt freely, attribute prominently                                                 | `paid-gig-safe`                                                |
| CC-BY-SA                                       | Adapt, but the _app's_ code must also be CC-BY-SA; prefer build-original            | `paid-gig-safe` only if the whole app accepts SA terms         |
| CC-BY-NC / NC-SA                               | Do not copy code. Build original inspired by the _idea_. Attribute the inspiration. | `personal-only` if the result is still recognizably derivative |
| LGPL                                           | Dynamic-link only, attribute, ship LGPL notice. Prefer alternatives.                | `paid-gig-safe` if dynamic-linked cleanly                      |
| GPL / AGPL (packaged source we'd ship)         | Skip. Find a permissive alternative.                                                | not built                                                      |
| Unknown / no header                            | Treat as all rights reserved. Skip.                                                 | not built                                                      |

If unsure, mark `personal-only` and move on; do not bake legal risk into a paid-gig deliverable.

## Default rule of thumb

> **Trending feeds pick the idea; the license gate picks how it's built.**

NC-encumbered inspiration => write fresh code, attribute the inspiration, ship as `paid-gig-safe` if the new code is genuinely independent.

## Attribution template

Every app's `src/app/<slug>/README.md` ends with this block (omit fields that do not apply):

```markdown
## Attribution

- Inspired by: <Author Name>, "<Work Title>", <URL>
- License of inspiration: <SPDX or CC code>
- Code adapted from: <Author Name>, <repo/sketch URL>, <license>
- Original / inspired-only: yes | no
```

Mirror the same block into [`/NOTICES.md`](/NOTICES.md) under the **Adaptations** section, so the root notices file stays the single audit point.

## Dependency licenses

Vetted deps (added per [`CONVENTIONS.md`](./CONVENTIONS.md) checklist) are logged in [`/NOTICES.md`](/NOTICES.md) under **Dependencies** with their SPDX identifier. CI does not enforce this yet; the human + agent are the gate.

## When in doubt

- Default to building original code inspired by the concept.
- Default `commercialUse` to `personal-only` when the legal answer is fuzzy.
- Ask before shipping a `paid-gig-safe` flag on borderline cases.
