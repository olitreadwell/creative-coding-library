# Sources

Where ideas and code come from. Roles, not rankings.

## TL;DR

- **Default**: pick an idea from row A, build it with code from row B.
- **Fallback**: if no row-B code fits, build original code inspired by row A, attribute the inspiration.
- **Reach for row D only on purpose** (and tag the resulting app `personal-only`).

## Row A — Trending feeds (idea source)

Use these to _pick_ what to build. The license here only matters for attribution.

- OpenProcessing — daily / weekly trending
- Shadertoy — popular this week
- Codrops — articles + demos
- Awesome Creative Coding (terkelg/awesome-creative-coding) — recent additions
- three.js examples + threejs-journey gallery
- /r/creativecoding, /r/generative
- VJ / TouchDesigner content on YouTube (idea only, never code; different runtime)
- Major creative coders' personal sites and Twitter / Mastodon / Bluesky

## Row B — Permissive code (default to adapt)

These are the _first_ place to look for code to read, learn from, and adapt freely. Always still attribute.

- three.js (MIT)
- R3F / drei (MIT)
- regl (MIT)
- ogl (MIT)
- two.js (MIT)
- matter.js (MIT)
- rapier.js (Apache-2.0)
- GSAP free tier (no-charge license, paid-gig safe per current terms; verify before each build)
- motion / framer-motion (MIT)
- d3 / Observable Plot / Visx (ISC / Apache-2.0 / MIT)
- p5.js (LGPL-2.1 — be careful, see LICENSING.md before bundling)
- glslify / glsl-noise (MIT)
- culori (MIT)
- MediaPipe Web (Apache-2.0)
- Tone.js (MIT)
- Meyda (MIT)
- A-Frame (MIT)
- chroma.js (Apache-2.0)
- opentype.js (MIT)

## Row C — Reference / fallback (read, do not copy)

Use for understanding the _concept_, then write original code.

- The Nature of Code (Shiffman) — concept reference
- MDN — Canvas, WebGL, Web Audio APIs
- WebGL Fundamentals
- The Book of Shaders
- Real-Time Rendering, 4th ed.
- Inigo Quilez articles (educational, attribute if borrowing techniques)

## Row D — Personal-only opt-in (NC sources)

These ship under non-commercial-friendly licenses. Building from them locks the app to `commercialUse: "personal-only"`. Reach here only when the idea is unmissable.

- OpenProcessing sketches default to CC-BY-SA or CC-BY-NC; many are MIT but check per-sketch.
- Shadertoy code defaults to CC-BY-NC-SA 3.0 unless the author overrode it.
- Pen / CodePen — license per-pen, often unclear.

## Row E — Avoid

- GPL / AGPL packaged source you would have to ship — incompatible with commercial reuse here.
- Code with no license header at all (US copyright default is "all rights reserved").
- Unattributed reposts / mirrors.
- Tutorials behind a paywall whose code is meant only for purchasers.
