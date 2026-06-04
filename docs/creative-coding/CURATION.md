# Curator Playbook

What the **curator** run does each time it fires. The curator finds ideas and files issues. It does not build.

## TL;DR

1. Scan trending sources (see [`SOURCES.md`](./SOURCES.md)).
2. Scan [`KNOWLEDGE-MAP.md`](./KNOWLEDGE-MAP.md) for `gap` and `partial` rows.
3. Open well-formed, deduped `app-idea` issues.
4. Stop. No code changes.

## Step 1 — gather candidates

Trending-first. Pull from row A (trending feeds) in `SOURCES.md`:

- OpenProcessing this week / month.
- Shadertoy popular.
- Codrops articles + demos.
- Awesome-creative-coding repo recent commits.
- three.js examples + r3f-discoveries.
- /r/creativecoding hot.
- VJ / TouchDesigner adjacents on YouTube (idea only, never code).

Then sweep row B (permissive code) for things that _could_ embody current `gap` rows in the knowledge map.

## Step 2 — score and filter

For each candidate:

- **Knowledge gap value**: does it cover a `gap` row? Higher = better.
- **Non-overlap**: does the library + dominant concepts differ from existing apps?
- **License**: is the source permissive? If NC / SA, the build will need original code (still fine; flag in the issue).
- **Buildable size**: roughly half a day of agent time. Skip anything that needs custom datasets, calibration rigs, or vendor accounts.
- **Safety**: no strobe, no shock content.

## Step 3 — dedup

For each surviving candidate:

- Search open + closed issues for the slug or near-matches.
- Read `src/lib/creative/registry.generated.ts` for existing apps with the same library + concept overlap.
- If duplicate or near-duplicate, drop it.

## Step 4 — file the issue

Use the `app-idea` issue template. Apply labels:

- `app-idea` (required)
- `kind:creative` or `kind:data-viz`
- `level:1` | `level:2` | `level:3`
- `library:<name>` (one or more)
- `license:permissive` | `license:nc` | `license:unknown`
- `priority:low` | `priority:med` | `priority:high` (curator picks `med` by default)
- `ai-proposed` (always for curator) or `user` (for human-filed)

Issue body must include:

- One-line pitch.
- Concept(s) it teaches.
- Inspiration source URL + license.
- Suggested approach (1–3 bullets).
- Knowledge-map row it covers.

## Step 5 — stop

Do not open PRs. Do not edit code. Do not edit `KNOWLEDGE-MAP.md` (the builder does that after merge).

## Label taxonomy reference

| Label         | Values                                | Purpose                            |
| ------------- | ------------------------------------- | ---------------------------------- |
| `app-idea`    | (flag)                                | All idea issues carry this         |
| `kind:*`      | `creative`, `data-viz`                | Which playbook applies             |
| `level:*`     | `1`, `2`, `3`                         | Curriculum level (see ROADMAP)     |
| `library:*`   | `gsap`, `three`, `r3f`, `matter`, ... | One or more                        |
| `license:*`   | `permissive`, `nc`, `unknown`         | Drives build approach              |
| `priority:*`  | `low`, `med`, `high`                  | User signal (or curator's default) |
| `ai-proposed` | (flag)                                | Filed by curator run               |
| `user`        | (flag)                                | Filed by a human                   |

## Things the curator must not do

- Open more than ~5 issues per run (avoid backlog spam).
- File ideas that need NDA'd assets, paid datasets, or proprietary APIs.
- Modify code or docs in this repo.
- Touch closed issues.
