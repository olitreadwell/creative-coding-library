"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColors } from "@/lib/creative/cbpalette";
import { wrapText } from "../layout-text";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Quote = { quote: string; author: string };

type LayoutId = "top-left" | "centered-band" | "big-number";

type SchemeId = "ink-sky" | "ink-gold" | "ink-green" | "bright-purple";

// ---------------------------------------------------------------------------
// Fallback quotes (public domain, shown immediately before fetch resolves)
// ---------------------------------------------------------------------------

const FALLBACK_QUOTES: readonly Quote[] = [
  {
    quote: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu",
  },
  {
    quote: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
  },
  {
    quote: "Life is what happens when you are busy making other plans.",
    author: "John Lennon",
  },
  {
    quote: "That which does not kill us makes us stronger.",
    author: "Friedrich Nietzsche",
  },
  {
    quote: "Imagination is more important than knowledge.",
    author: "Albert Einstein",
  },
  {
    quote: "To be or not to be, that is the question.",
    author: "William Shakespeare",
  },
  {
    quote: "We accept the love we think we deserve.",
    author: "Stephen Chbosky",
  },
  {
    quote: "Not all those who wander are lost.",
    author: "J.R.R. Tolkien",
  },
];

function randomFallback(): Quote {
  const idx = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  return FALLBACK_QUOTES[idx] ?? FALLBACK_QUOTES[0]!;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchQuote(signal: AbortSignal): Promise<Quote> {
  const res = await fetch("https://dummyjson.com/quotes/random", { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { quote: string; author: string };
  return { quote: data.quote, author: data.author };
}

// ---------------------------------------------------------------------------
// Color schemes
// ---------------------------------------------------------------------------

type Scheme = {
  label: string;
  // block fill color
  block: string;
  // primary type color
  ink: string;
  // secondary / rule color
  rule: string;
  // canvas background
  bg: string;
};

const LIGHT_PALETTE = cbColors("light");
const DARK_PALETTE = cbColors("dark");

function buildSchemes(resolvedTheme: string | undefined): Record<SchemeId, Scheme> {
  const onDark = resolvedTheme !== "light";

  const pal = onDark ? DARK_PALETTE : LIGHT_PALETTE;

  // Each scheme picks two colors from the protanopia-safe palette.
  return {
    "ink-sky": {
      label: "Sky",
      block: pal[0] ?? "#56B4E9",
      ink: onDark ? "#f0f0f0" : "#0d0d0d",
      rule: pal[1] ?? "#E69F00",
      bg: onDark ? "#111111" : "#f5f5f5",
    },
    "ink-gold": {
      label: "Gold",
      block: pal[1] ?? "#E69F00",
      ink: onDark ? "#f0f0f0" : "#0d0d0d",
      rule: pal[2] ?? "#009E73",
      bg: onDark ? "#111111" : "#f5f5f5",
    },
    "ink-green": {
      label: "Green",
      block: pal[2] ?? "#009E73",
      ink: onDark ? "#f0f0f0" : "#0d0d0d",
      rule: pal[0] ?? "#56B4E9",
      bg: onDark ? "#111111" : "#f5f5f5",
    },
    "bright-purple": {
      label: "Purple",
      block: pal[4] ?? "#CC79A7",
      ink: onDark ? "#f0f0f0" : "#0d0d0d",
      rule: pal[3] ?? "#F0E442",
      bg: onDark ? "#111111" : "#f5f5f5",
    },
  };
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

type DrawPosterOptions = {
  ctx: CanvasRenderingContext2D;
  cssW: number;
  cssH: number;
  quote: Quote;
  layout: LayoutId;
  scheme: Scheme;
};

function drawPoster({ ctx, cssW, cssH, quote, layout, scheme }: DrawPosterOptions): void {
  const { quote: text, author } = quote;

  // Clear
  ctx.fillStyle = scheme.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const margin = Math.round(cssW * 0.07);
  const innerW = cssW - margin * 2;

  if (layout === "top-left") {
    drawTopLeft({ ctx, cssW, cssH, text, author, margin, innerW, scheme });
  } else if (layout === "centered-band") {
    drawCenteredBand({ ctx, cssW, cssH, text, author, margin, innerW, scheme });
  } else {
    drawBigNumber({ ctx, cssW, cssH, text, author, margin, innerW, scheme });
  }
}

// ---- Layout: top-left -------------------------------------------------------
// Color block top-left quadrant; quote bottom-right zone.

type LayoutArgs = {
  ctx: CanvasRenderingContext2D;
  cssW: number;
  cssH: number;
  text: string;
  author: string;
  margin: number;
  innerW: number;
  scheme: Scheme;
};

function drawTopLeft({ ctx, cssW, cssH, text, author, margin, innerW, scheme }: LayoutArgs): void {
  const blockH = Math.round(cssH * 0.42);
  const blockW = Math.round(cssW * 0.55);

  // Color block
  ctx.fillStyle = scheme.block;
  ctx.fillRect(0, 0, blockW, blockH);

  // Quote text starts below the block
  const quoteTop = blockH + margin;
  const quoteFontSize = Math.max(16, Math.round(cssW * 0.042));
  ctx.font = `700 ${quoteFontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  ctx.fillStyle = scheme.ink;
  ctx.textBaseline = "top";

  const lines = wrapText(ctx, text, innerW);
  const lineH = quoteFontSize * 1.25;
  lines.forEach((line, i) => {
    ctx.fillText(line, margin, quoteTop + i * lineH);
  });

  // Rule line
  const ruleY = Math.round(quoteTop + lines.length * lineH + margin * 0.6);
  ctx.strokeStyle = scheme.rule;
  ctx.lineWidth = Math.max(2, Math.round(cssW * 0.005));
  ctx.beginPath();
  ctx.moveTo(margin, ruleY);
  ctx.lineTo(margin + innerW * 0.35, ruleY);
  ctx.stroke();

  // Author
  const authorFontSize = Math.max(11, Math.round(quoteFontSize * 0.55));
  ctx.font = `400 ${authorFontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  ctx.fillStyle = scheme.rule;
  ctx.fillText(`-- ${author}`, margin, ruleY + margin * 0.5);
}

// ---- Layout: centered-band --------------------------------------------------
// Full-width color band mid-canvas; quote sits inside it reversed.

function drawCenteredBand({
  ctx,
  cssW,
  cssH,
  text,
  author,
  margin,
  innerW,
  scheme,
}: LayoutArgs): void {
  const bandTop = Math.round(cssH * 0.28);
  const bandH = Math.round(cssH * 0.44);

  ctx.fillStyle = scheme.block;
  ctx.fillRect(0, bandTop, cssW, bandH);

  // Quote inside band (inverted ink = bg color for contrast)
  const quoteFontSize = Math.max(16, Math.round(cssW * 0.038));
  ctx.font = `700 ${quoteFontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;

  // Measure lines to vertically center inside band
  const lines = wrapText(ctx, text, innerW);
  const lineH = quoteFontSize * 1.25;
  const blockTextH = lines.length * lineH;
  const textTop = bandTop + (bandH - blockTextH) / 2 - lineH * 0.1;

  ctx.fillStyle = scheme.bg;
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx.fillText(line, margin, textTop + i * lineH);
  });

  // Rule above band
  const ruleY = bandTop - margin * 0.75;
  ctx.strokeStyle = scheme.rule;
  ctx.lineWidth = Math.max(2, Math.round(cssW * 0.005));
  ctx.beginPath();
  ctx.moveTo(margin, ruleY);
  ctx.lineTo(cssW - margin, ruleY);
  ctx.stroke();

  // Author below band
  const authorFontSize = Math.max(11, Math.round(quoteFontSize * 0.55));
  ctx.font = `400 ${authorFontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  ctx.fillStyle = scheme.rule;
  ctx.fillText(`-- ${author}`, margin, bandTop + bandH + margin * 0.5);
}

// ---- Layout: big-number -----------------------------------------------------
// A large decorative numeral (#) upper-right; quote flows left.

function drawBigNumber({
  ctx,
  cssW,
  cssH,
  text,
  author,
  margin,
  innerW,
  scheme,
}: LayoutArgs): void {
  // Big decorative glyph
  const glyphSize = Math.round(cssH * 0.55);
  ctx.font = `900 ${glyphSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  ctx.fillStyle = scheme.block;
  ctx.textBaseline = "top";
  ctx.globalAlpha = 0.22;
  ctx.fillText("#", cssW - glyphSize * 0.6, cssH * 0.1);
  ctx.globalAlpha = 1;

  // Quote in left zone
  const quoteW = Math.round(innerW * 0.75);
  const quoteFontSize = Math.max(16, Math.round(cssW * 0.042));
  ctx.font = `700 ${quoteFontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  ctx.fillStyle = scheme.ink;

  const lines = wrapText(ctx, text, quoteW);
  const lineH = quoteFontSize * 1.25;
  const totalH = lines.length * lineH;
  const topY = (cssH - totalH) / 2 - lineH;

  lines.forEach((line, i) => {
    ctx.fillText(line, margin, topY + i * lineH);
  });

  // Rule
  const ruleY = Math.round(topY + totalH + margin * 0.6);
  ctx.strokeStyle = scheme.rule;
  ctx.lineWidth = Math.max(2, Math.round(cssW * 0.005));
  ctx.beginPath();
  ctx.moveTo(margin, ruleY);
  ctx.lineTo(margin + quoteW * 0.4, ruleY);
  ctx.stroke();

  // Author
  const authorFontSize = Math.max(11, Math.round(quoteFontSize * 0.55));
  ctx.font = `400 ${authorFontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  ctx.fillStyle = scheme.rule;
  ctx.fillText(`-- ${author}`, margin, ruleY + margin * 0.5);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const btnClass =
  "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const selectClass =
  "text-sm rounded border border-border bg-background text-foreground/70 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const LAYOUT_OPTIONS: { value: LayoutId; label: string }[] = [
  { value: "top-left", label: "Top-left block" },
  { value: "centered-band", label: "Centered band" },
  { value: "big-number", label: "Big glyph" },
];

const SCHEME_IDS: SchemeId[] = ["ink-sky", "ink-gold", "ink-green", "bright-purple"];

export default function PosterPoetryPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Deterministic first quote so server and client render the same markup (no
  // hydration mismatch). A random fallback / fetched quote replaces it on mount.
  const [quote, setQuote] = useState<Quote>(() => FALLBACK_QUOTES[0]!);
  const [layout, setLayout] = useState<LayoutId>("top-left");
  const [schemeId, setSchemeId] = useState<SchemeId>("ink-sky");
  const [fetching, setFetching] = useState(false);

  const { resolvedTheme } = useTheme();

  const schemes = buildSchemes(resolvedTheme);
  const scheme = schemes[schemeId];
  const canvasBg = scheme.bg;

  // Stable refs so the draw callback always reads latest values without
  // needing a new ResizeObserver subscription.
  const quoteRef = useRef<Quote>(quote);
  const layoutRef = useRef<LayoutId>(layout);
  const schemeRef = useRef<Scheme>(scheme);

  useEffect(() => {
    quoteRef.current = quote;
  }, [quote]);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);
  useEffect(() => {
    schemeRef.current = scheme;
  }, [scheme]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio ?? 1;
    ctx.resetTransform();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPoster({
      ctx,
      cssW: canvas.clientWidth,
      cssH: canvas.clientHeight,
      quote: quoteRef.current,
      layout: layoutRef.current,
      scheme: schemeRef.current,
    });
  }, []);

  // DPR-aware canvas resize via ResizeObserver.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      const dpr = window.devicePixelRatio ?? 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      draw();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  // Redraw when quote, layout, or scheme changes.
  useEffect(() => {
    draw();
  }, [quote, layout, scheme, draw]);

  // Fetch a fresh quote on mount, then on demand.
  const loadQuote = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setFetching(true);
    // Show a fresh fallback immediately (runs post-mount, so no hydration
    // issue) so the poster changes even if the network is slow or blocked.
    setQuote(randomFallback());

    fetchQuote(ctrl.signal)
      .then((q) => {
        setQuote(q);
      })
      .catch(() => {
        // Network failure or abort: keep the fallback, never throw.
      })
      .finally(() => {
        setFetching(false);
      });
  }, []);

  useEffect(() => {
    // Defer so the initial setState happens after the effect, not synchronously
    // inside it (avoids the cascading-render lint and is harmless for a fetch).
    const t = setTimeout(() => loadQuote(), 0);
    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [loadQuote]);

  const ariaLabel = `Swiss-style typographic poster. Quote: "${quote.quote}" by ${quote.author}.`;

  const schemeOptions = SCHEME_IDS.map((id) => ({
    id,
    label: schemes[id].label,
  }));

  return (
    <PlayShell
      slug="poster-poetry"
      title="Poster Poetry"
      visualLabel={ariaLabel}
      animated={false}
      attribution={
        <>
          Quotes from{" "}
          <a
            href="https://dummyjson.com/docs/quotes"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            DummyJSON
          </a>
          . Swiss-style generative typography. MIT licensed.
        </>
      }
      controls={
        <>
          <button
            type="button"
            onClick={loadQuote}
            disabled={fetching}
            className={btnClass}
            aria-label="Fetch a new quote"
          >
            {fetching ? "Loading..." : "New quote"}
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="poster-layout" className="text-xs text-foreground/70 shrink-0">
              layout
            </label>
            <select
              id="poster-layout"
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutId)}
              className={selectClass}
            >
              {LAYOUT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="poster-scheme" className="text-xs text-foreground/70 shrink-0">
              color
            </label>
            <select
              id="poster-scheme"
              value={schemeId}
              onChange={(e) => setSchemeId(e.target.value as SchemeId)}
              className={selectClass}
            >
              {schemeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        suppressHydrationWarning
        style={{ background: canvasBg }}
        aria-label={ariaLabel}
      />
    </PlayShell>
  );
}
