# Dataset Licensing

How to decide whether a data-viz app can ship as **paid-gig-safe**.

## TL;DR

| Dataset license                                           | Build approach                                      | App's `commercialUse`                            |
| --------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| CC0 / Public Domain                                       | Use freely                                          | `paid-gig-safe`                                  |
| CC-BY                                                     | Use, attribute prominently                          | `paid-gig-safe`                                  |
| CC-BY-SA                                                  | The viz output must also be CC-BY-SA                | `paid-gig-safe` if compatible                    |
| CC-BY-NC                                                  | Personal use only                                   | `personal-only`                                  |
| ODbL                                                      | Derived data shares ODbL; commercial-OK but careful | `paid-gig-safe` with disclosure of derived terms |
| Government open data (NZ CC-BY, UK OGL, US public domain) | Attribute per terms                                 | `paid-gig-safe`                                  |
| Scraped / TOS-restricted                                  | Skip                                                | not built                                        |
| Unknown / no license                                      | Skip                                                | not built                                        |

## Attribution block

Every data-viz app's `src/app/<slug>/README.md` ends with this **Dataset** block:

```markdown
## Dataset

- Source: <Org Name>, "<Dataset Title>", <URL>
- License: <SPDX or CC code>
- Snapshot date: <YYYY-MM-DD>
- Update cadence: <e.g. monthly>
- Required attribution: <verbatim string if the license specifies one>
```

Mirror into [`/NOTICES.md`](/NOTICES.md) under **Datasets**.

## When in doubt

- Mark `personal-only` and ship.
- Open an issue to revisit when the license is clarified.
- Never strip a required attribution from a license that demands it (CC-BY family, OGL, ODbL).
