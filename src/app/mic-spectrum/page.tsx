import type { Metadata } from "next";
import Link from "next/link";
import { meta } from "./app.meta";

export const metadata: Metadata = {
  title: `${meta.title} — creative-coding-library`,
  description: meta.description,
};

export default function MicSpectrumPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav className="mb-6 text-sm">
        <Link className="underline text-foreground/70" href="/">
          ← home
        </Link>
      </nav>

      <h1 className="text-2xl font-semibold">{meta.title}</h1>
      <p className="mt-2 text-foreground/70">{meta.description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground/60">
        <span className="rounded border border-foreground/15 px-1.5 py-0.5">{meta.library}</span>
        <span className="rounded border border-foreground/15 px-1.5 py-0.5">
          Level {meta.level}
        </span>
        <span className="rounded border border-foreground/15 px-1.5 py-0.5">
          {meta.commercialUse}
        </span>
        {meta.concepts.map((c) => (
          <span key={c} className="rounded border border-foreground/15 px-1.5 py-0.5">
            {c}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/mic-spectrum/play"
          className="inline-block rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Open sketch
        </Link>
      </div>

      <section className="mt-10 space-y-6 text-sm leading-relaxed text-foreground/80">
        <div>
          <h2 className="text-base font-semibold text-foreground">What it is</h2>
          <p className="mt-2">
            Mic Spectrum listens to your microphone and draws a live bar chart of the sound
            frequencies it picks up. Bass sits on the left, treble on the right. Each bar grows
            taller when that frequency is louder.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">Why frequency analysis matters</h2>
          <p className="mt-2">
            Sound is not just one thing at one volume. A guitar chord, a voice, a drum hit: each
            contains many frequencies at once. The Web Audio API splits that mix into bins using an
            FFT (Fast Fourier Transform). Each bin tells you how much energy lives in a narrow band
            of frequencies. Visualising those bins in real time is one of the clearest ways to see
            how different sounds are built from components.
          </p>
          <p className="mt-2">
            This sketch uses a small number of concepts: request microphone access, create a web
            audio graph, read FFT data every frame, and paint bars on a canvas. Understanding these
            four steps lets you build equalizers, music visualizers, voice-activated effects, and
            more.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">How to use it</h2>
          <ol className="mt-2 list-decimal list-inside space-y-1">
            <li>Open the sketch and click "Enable microphone".</li>
            <li>Your browser asks permission to use the mic. Allow it.</li>
            <li>Speak, play music, or snap your fingers near the mic.</li>
            <li>Watch the bars jump. Lower bars at the left, higher-pitched sounds at the right.</li>
            <li>
              Use the sliders to adjust gain (louder input) and smoothing (how fast bars
              settle).
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">Key technique</h2>
          <p className="mt-2">
            The sketch wires a <code>MediaStreamAudioSourceNode</code> into an{" "}
            <code>AnalyserNode</code>. Each animation frame it calls{" "}
            <code>getByteFrequencyData</code> to fill a{" "}
            <code>Uint8Array</code> with 0–255 values, one per frequency bin. Those values drive the
            bar heights on the canvas.
          </p>
          <p className="mt-2">
            The color of each bar maps its frequency position to a colorblind-safe hue ramp: warm
            tones for bass, cooler tones for treble.
          </p>
        </div>
      </section>

      <footer className="mt-12 border-t border-foreground/10 pt-6 text-xs text-foreground/50">
        <p>
          Technique: {meta.technique}. License: {meta.license}. Built {meta.builtAt}.
        </p>
      </footer>
    </main>
  );
}
