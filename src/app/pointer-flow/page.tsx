import Link from "next/link";
import type { Metadata } from "next";
import { meta } from "./app.meta";

export const metadata: Metadata = {
  title: `${meta.title} — creative-coding-library`,
  description: meta.description,
};

export default function PointerFlowPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <nav className="mb-8 text-sm">
        <Link href="/creative" className="text-foreground/70 underline">
          ← catalog
        </Link>
      </nav>

      <h1 className="text-3xl font-semibold">{meta.title}</h1>
      <p className="mt-3 text-foreground/70">{meta.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-foreground/60">
        {[meta.library, `L${meta.level}`, meta.commercialUse, ...meta.concepts].map((tag) => (
          <span key={tag} className="rounded border border-foreground/15 px-1.5 py-0.5">
            {tag}
          </span>
        ))}
      </div>

      <Link
        href="/pointer-flow/play"
        className="mt-8 inline-block rounded bg-foreground/10 px-5 py-2.5 text-sm font-medium hover:bg-foreground/20"
      >
        Open sketch
      </Link>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">What this is</h2>
        <p className="text-foreground/80">
          Pointer Flow places a field of small dots on a canvas. Each dot notices where your
          cursor is and either drifts toward it or pushes away, depending on the mode you pick.
          When you click, a pulse radiates outward and scatters every nearby particle.
        </p>
        <p className="text-foreground/80">
          The result looks organic but is built from a small number of simple rules applied to
          every dot on each animation frame.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">The big idea in plain words</h2>
        <p className="text-foreground/80">
          A particle system is just a list of objects, each with a position and a speed. On every
          frame you update the speed based on some forces (here: pointer attraction or repulsion,
          plus the shockwave impulse from a click), then move the object by its speed times the
          elapsed time. Friction stops things from going faster and faster forever.
        </p>
        <p className="text-foreground/80">
          Pointer events (mouse, touch, stylus) all fire through the same browser API, so the
          sketch works on phones and tablets without any extra code.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Why it matters for creative coding</h2>
        <p className="text-foreground/80">
          Interaction makes a sketch feel alive in a way pure animation cannot. Connecting user
          input to particle physics is a repeating pattern across generative art, game prototyping,
          and data visualization. Once you understand the attract/repel pattern here you can apply
          it to flocking birds, magnetic field lines, or network graph layouts.
        </p>
      </section>

      <section className="mt-10 space-y-6">
        <h2 className="text-xl font-semibold">How the code works</h2>

        <div>
          <h3 className="font-medium text-foreground/90">Step 1 — Seed initial positions</h3>
          <p className="mt-1 text-sm text-foreground/70">
            {"`makeRng(\"pointer-flow\")`"} creates a deterministic pseudo-random number generator.
            Passing the same string every time means the initial dot layout is identical on every
            page load. The dots are spread randomly across the canvas width and height.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-foreground/90">Step 2 — Resize the canvas correctly</h3>
          <p className="mt-1 text-sm text-foreground/70">
            A {"`ResizeObserver`"} watches the canvas element. When the size changes, the canvas
            pixel buffer is set to {"`clientWidth * devicePixelRatio`"} so it stays sharp on
            high-density screens. A {"`ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`"} call lets all
            drawing code use CSS pixel coordinates.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-foreground/90">Step 3 — React to pointer events</h3>
          <p className="mt-1 text-sm text-foreground/70">
            {"`onPointerMove`"} records the cursor position in a ref. A ref (not state) is used so
            updates do not trigger a React re-render on every mouse move, keeping the animation
            smooth. {"`onPointerDown`"} appends a new impulse object to a second ref.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-foreground/90">Step 4 — Update particles each frame</h3>
          <p className="mt-1 text-sm text-foreground/70">
            {"`useAnimationFrame`"} from the shared library drives the loop and pauses it when the
            browser tab is hidden. Each frame: clear the canvas, age and remove old impulses, draw
            expanding shockwave rings, then for every particle compute the pointer force, add any
            impulse force, apply friction, clamp speed, and move by {"`velocity * dt`"}.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-foreground/90">Step 5 — Colors from a safe palette</h3>
          <p className="mt-1 text-sm text-foreground/70">
            Hues are sampled from a fixed set based on the Okabe-Ito palette, which is safe for
            the most common forms of colour vision difference. Red-only and green-only encodings
            are avoided. Lightness flips depending on whether the OS reports a dark or light colour
            scheme.
          </p>
        </div>
      </section>

      <footer className="mt-12 border-t border-foreground/10 pt-6 text-xs text-foreground/50">
        <p>
          Built {meta.builtAt} — {meta.license} license, {meta.commercialUse}.
        </p>
        <p className="mt-1">Technique: {meta.technique}.</p>
      </footer>
    </main>
  );
}
