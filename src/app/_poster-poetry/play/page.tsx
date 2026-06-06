"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PlayShell } from "@/components/play-shell";
import { cbColors } from "@/lib/creative/cbpalette";
import { makeRng, pick, type Rng } from "@/lib/creative/random";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Quote = { quote: string; author: string };

type LayoutId = "slash-stack" | "cross-axis" | "billboard";

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
  /** Primary block fill */
  block: string;
  /** Secondary block fill */
  block2: string;
  /** Ink on raw canvas background */
  ink: string;
  /** Ink reversed out of a block */
  inkReversed: string;
  /** Rule / accent */
  rule: string;
  /** Canvas background */
  bg: string;
};

const LIGHT_PALETTE = cbColors("light");
const DARK_PALETTE = cbColors("dark");

function buildSchemes(resolvedTheme: string | undefined): Record<SchemeId, Scheme> {
  const onDark = resolvedTheme !== "light";
  const pal = onDark ? DARK_PALETTE : LIGHT_PALETTE;

  const ink = onDark ? "#f0f0f0" : "#0d0d0d";
  const bg = onDark ? "#111111" : "#f5f5f5";

  return {
    "ink-sky": {
      label: "Sky",
      block: pal[0] ?? "#56B4E9",
      block2: pal[3] ?? "#F0E442",
      ink,
      inkReversed: onDark ? "#0d0d0d" : "#f5f5f5",
      rule: pal[1] ?? "#E69F00",
      bg,
    },
    "ink-gold": {
      label: "Gold",
      block: pal[1] ?? "#E69F00",
      block2: pal[2] ?? "#009E73",
      ink,
      inkReversed: onDark ? "#0d0d0d" : "#f5f5f5",
      rule: pal[0] ?? "#56B4E9",
      bg,
    },
    "ink-green": {
      label: "Green",
      block: pal[2] ?? "#009E73",
      block2: pal[0] ?? "#56B4E9",
      ink,
      inkReversed: onDark ? "#0d0d0d" : "#f5f5f5",
      rule: pal[4] ?? "#CC79A7",
      bg,
    },
    "bright-purple": {
      label: "Purple",
      block: pal[4] ?? "#CC79A7",
      block2: pal[3] ?? "#F0E442",
      ink,
      inkReversed: onDark ? "#0d0d0d" : "#f5f5f5",
      rule: pal[1] ?? "#E69F00",
      bg,
    },
  };
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

const FONT_FAMILY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Splits a quote into chunks: the first 1-3 words get their own chunks to be
 * set large. Remaining words are grouped 1-3 words each. Always deterministic
 * given the same quote text.
 */
function chunkQuote(text: string, rng: Rng): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  // Big opener: 1-2 words
  const openerCount = words.length > 4 ? 1 + Math.round(rng() * 1) : 1;
  if (words.length > 0) {
    chunks.push(words.slice(0, openerCount).join(" "));
  }

  // Body: groups of 1-3 words
  let i = openerCount;
  while (i < words.length) {
    const groupSize = 1 + Math.floor(rng() * 3);
    chunks.push(words.slice(i, i + groupSize).join(" "));
    i += groupSize;
  }

  return chunks;
}

/** Determines whether a chunk is rendered on a color block vs raw canvas. */
function isOnBlock(chunkIndex: number, rng: Rng): boolean {
  // First chunk: always on a block. Others: ~40% chance.
  if (chunkIndex === 0) return true;
  return rng() < 0.4;
}

// ---------------------------------------------------------------------------
// Layout: slash-stack
// Chunks stacked with alternating left/right alignment, each rotated a few
// degrees in alternating directions. One large opener. Diagonal rule bar.
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
  ctx.fillStyle = scheme.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const rng = makeRng(quote.quote);

  if (layout === "slash-stack") {
    drawSlashStack({ ctx, cssW, cssH, quote, scheme, rng });
  } else if (layout === "cross-axis") {
    drawCrossAxis({ ctx, cssW, cssH, quote, scheme, rng });
  } else {
    drawBillboard({ ctx, cssW, cssH, quote, scheme, rng });
  }
}

// ---------------------------------------------------------------------------
// Shared drawing utilities
// ---------------------------------------------------------------------------

type BlockWordOptions = {
  ctx: CanvasRenderingContext2D;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  rotateDeg: number;
  onBlock: boolean;
  blockColor: string;
  textColor: string;
  blockPad: number;
};

/**
 * Draws a single word/phrase, optionally on a filled color block,
 * using translate/rotate/restore for positioning. The x/y is the
 * top-left corner of the text before rotation.
 */
function drawBlockWord({
  ctx,
  text,
  x,
  y,
  fontSize,
  rotateDeg,
  onBlock,
  blockColor,
  textColor,
  blockPad,
}: BlockWordOptions): void {
  const rad = (rotateDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rad);

  ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";

  const tw = ctx.measureText(text).width;
  const th = fontSize * 1.15;

  if (onBlock) {
    ctx.fillStyle = blockColor;
    ctx.fillRect(-blockPad, -blockPad * 0.5, tw + blockPad * 2, th + blockPad);
  }

  ctx.fillStyle = textColor;
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

/**
 * Draws the author credit at bottom-left, always horizontal.
 */
function drawAuthor(
  ctx: CanvasRenderingContext2D,
  author: string,
  cssW: number,
  cssH: number,
  scheme: Scheme,
  authorFontSize: number,
): void {
  const margin = Math.round(cssW * 0.06);
  ctx.save();
  ctx.font = `400 ${authorFontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = scheme.rule;
  ctx.fillText(`-- ${author}`, margin, cssH - margin);
  ctx.restore();
}

/**
 * Draws a thick diagonal rule bar (decorative).
 */
function drawDiagBar(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  thickness: number,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Layout A: slash-stack
// Words stack top-to-bottom with alternating rotations (-8 to +8 deg).
// The opener is very large. A thick diagonal rule slashes across mid-canvas.
// ---------------------------------------------------------------------------

type LayoutFnArgs = {
  ctx: CanvasRenderingContext2D;
  cssW: number;
  cssH: number;
  quote: Quote;
  scheme: Scheme;
  rng: Rng;
};

const SLASH_ROTATIONS = [-8, 6, -4, 9, -7, 5, -3] as const;

function drawSlashStack({ ctx, cssW, cssH, quote, scheme, rng }: LayoutFnArgs): void {
  const margin = Math.round(cssW * 0.07);
  const chunks = chunkQuote(quote.quote, rng);
  const authorFontSize = Math.max(11, Math.round(cssW * 0.024));

  // Base font size for body chunks
  const bodySize = Math.max(18, Math.round(cssW * 0.05));
  const openerSize = Math.max(36, Math.round(cssW * 0.13));
  const blockPad = Math.round(bodySize * 0.25);

  // Diagonal rule behind everything
  drawDiagBar(
    ctx,
    0,
    cssH * 0.55,
    cssW,
    cssH * 0.38,
    scheme.rule,
    Math.max(3, Math.round(cssW * 0.008)),
  );

  // Place chunks top to bottom with some stagger
  let curY = margin * 0.8;
  const rotCycle = [...SLASH_ROTATIONS];

  chunks.forEach((chunk, ci) => {
    const isFirst = ci === 0;
    const fontSize = isFirst ? openerSize : bodySize;
    const onBlock = isOnBlock(ci, rng);
    const rotIdx = ci % rotCycle.length;
    const rotateDeg = rotCycle[rotIdx] ?? 0;

    // Alternate x position: odd chunks nudge right
    const nudge = ci % 2 === 1 ? Math.round(cssW * 0.12) : 0;
    const x = margin + nudge;

    ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;
    ctx.textBaseline = "top";

    const textColor = onBlock ? scheme.inkReversed : scheme.ink;
    const blockColor = ci % 2 === 0 ? scheme.block : scheme.block2;

    drawBlockWord({
      ctx,
      text: chunk,
      x,
      y: curY,
      fontSize,
      rotateDeg,
      onBlock,
      blockColor,
      textColor,
      blockPad,
    });

    const lineH = fontSize * (isFirst ? 1.05 : 1.2);
    curY += lineH + (isFirst ? margin * 0.3 : 0);

    // Cap so author always fits
    if (curY > cssH - authorFontSize * 5) return;
  });

  drawAuthor(ctx, quote.author, cssW, cssH, scheme, authorFontSize);
}

// ---------------------------------------------------------------------------
// Layout B: cross-axis
// Some words run vertically (rotated 90 deg), others horizontally.
// Creates a strong grid collision effect.
// ---------------------------------------------------------------------------

const CROSS_ROTATIONS = [0, -90, 0, 90, 0, -90, 20] as const;

function drawCrossAxis({ ctx, cssW, cssH, quote, scheme, rng }: LayoutFnArgs): void {
  const margin = Math.round(cssW * 0.07);
  const chunks = chunkQuote(quote.quote, rng);
  const authorFontSize = Math.max(11, Math.round(cssW * 0.024));

  const openerSize = Math.max(40, Math.round(cssW * 0.11));
  const bodySize = Math.max(16, Math.round(cssW * 0.044));
  const blockPad = Math.round(bodySize * 0.3);

  // Background wide rule band
  ctx.save();
  ctx.fillStyle = scheme.block2;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(0, cssH * 0.45, cssW, cssH * 0.08);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Place chunks around a cross-shaped grid
  // Horizontal track at ~30% height, vertical track at ~65% width
  const hTrackY = Math.round(cssH * 0.28);
  const vTrackX = Math.round(cssW * 0.62);

  let hCursor = margin;
  let vCursor = Math.round(cssH * 0.1);

  chunks.forEach((chunk, ci) => {
    const isFirst = ci === 0;
    const fontSize = isFirst ? openerSize : bodySize;
    const onBlock = isOnBlock(ci, rng);
    const rotDeg = CROSS_ROTATIONS[ci % CROSS_ROTATIONS.length] ?? 0;

    ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;
    ctx.textBaseline = "top";

    const textColor = onBlock ? scheme.inkReversed : scheme.ink;
    const blockColor = ci % 2 === 0 ? scheme.block : scheme.block2;
    const tw = ctx.measureText(chunk).width;

    let x: number;
    let y: number;

    if (isFirst) {
      // Opener: horizontal, top-left
      x = margin;
      y = margin;
    } else if (ci % 3 === 0) {
      // Vertical column
      x = vTrackX;
      y = vCursor;
      vCursor += fontSize * 1.3 + margin * 0.3;
      if (vCursor > cssH * 0.85) vCursor = Math.round(cssH * 0.1);
    } else {
      // Horizontal row
      x = hCursor;
      y = hTrackY + (ci % 2 === 0 ? 0 : fontSize * 1.4);
      hCursor += tw + margin * 0.6;
      if (hCursor > cssW * 0.9) hCursor = margin;
    }

    drawBlockWord({
      ctx,
      text: chunk,
      x,
      y,
      fontSize,
      rotateDeg: rotDeg,
      onBlock,
      blockColor,
      textColor,
      blockPad,
    });
  });

  // A thick vertical rule bar
  drawDiagBar(
    ctx,
    Math.round(cssW * 0.55),
    0,
    Math.round(cssW * 0.55),
    cssH * 0.42,
    scheme.rule,
    Math.max(4, Math.round(cssW * 0.012)),
  );

  drawAuthor(ctx, quote.author, cssW, cssH, scheme, authorFontSize);
}

// ---------------------------------------------------------------------------
// Layout C: billboard
// Massive single word or short phrase dominates center; remaining words
// fragment around it at wild angles. Inspired by punk/protest poster energy.
// ---------------------------------------------------------------------------

type AngleDef = { deg: number; xFrac: number; yFrac: number };

const BILLBOARD_POSITIONS: readonly AngleDef[] = [
  { deg: 0, xFrac: 0.06, yFrac: 0.06 },
  { deg: -20, xFrac: 0.55, yFrac: 0.08 },
  { deg: 12, xFrac: 0.06, yFrac: 0.72 },
  { deg: -8, xFrac: 0.58, yFrac: 0.78 },
  { deg: 30, xFrac: 0.72, yFrac: 0.42 },
  { deg: -15, xFrac: 0.04, yFrac: 0.42 },
  { deg: 5, xFrac: 0.38, yFrac: 0.58 },
];

function drawBillboard({ ctx, cssW, cssH, quote, scheme, rng }: LayoutFnArgs): void {
  const margin = Math.round(cssW * 0.06);
  const chunks = chunkQuote(quote.quote, rng);
  const authorFontSize = Math.max(11, Math.round(cssW * 0.024));

  const centerFontSize = Math.max(48, Math.round(cssW * 0.16));
  const bodySize = Math.max(14, Math.round(cssW * 0.038));
  const blockPad = Math.round(bodySize * 0.3);

  // Loud background block top-right
  ctx.save();
  ctx.fillStyle = scheme.block;
  ctx.fillRect(cssW * 0.5, 0, cssW * 0.5, cssH * 0.35);
  ctx.restore();

  // Draw opener huge and centered
  const opener = chunks[0] ?? "";
  const centerX = Math.round(cssW * 0.5);
  const centerY = Math.round(cssH * 0.5);

  ctx.save();
  ctx.font = `900 ${centerFontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = scheme.ink;
  ctx.translate(centerX, centerY);
  ctx.rotate((pick(rng, [-3, 0, 3, -5, 5]) * Math.PI) / 180);
  ctx.fillText(opener, 0, 0);
  ctx.restore();

  // Scatter remaining chunks
  chunks.slice(1).forEach((chunk, ci) => {
    const posDef = BILLBOARD_POSITIONS[ci % BILLBOARD_POSITIONS.length] ?? BILLBOARD_POSITIONS[0]!;
    const onBlock = isOnBlock(ci + 1, rng);
    const textColor = onBlock ? scheme.inkReversed : scheme.ink;
    const blockColor = ci % 2 === 0 ? scheme.block2 : scheme.block;

    drawBlockWord({
      ctx,
      text: chunk,
      x: Math.round(posDef.xFrac * cssW),
      y: Math.round(posDef.yFrac * cssH),
      fontSize: bodySize,
      rotateDeg: posDef.deg,
      onBlock,
      blockColor,
      textColor,
      blockPad,
    });
  });

  // Thick horizontal rule across lower third
  drawDiagBar(
    ctx,
    0,
    Math.round(cssH * 0.68),
    cssW,
    Math.round(cssH * 0.68),
    scheme.rule,
    Math.max(5, Math.round(cssW * 0.014)),
  );

  drawAuthor(ctx, quote.author, cssW, cssH - margin * 0.5, scheme, authorFontSize);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const btnClass =
  "text-sm px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const selectClass =
  "text-sm rounded border border-border bg-background text-foreground/70 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const LAYOUT_OPTIONS: { value: LayoutId; label: string }[] = [
  { value: "slash-stack", label: "Slash stack" },
  { value: "cross-axis", label: "Cross axis" },
  { value: "billboard", label: "Billboard" },
];

const SCHEME_IDS: SchemeId[] = ["ink-sky", "ink-gold", "ink-green", "bright-purple"];

export default function PosterPoetryPlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Deterministic first quote so server and client render the same markup (no
  // hydration mismatch). A random fallback / fetched quote replaces it on mount.
  const [quote, setQuote] = useState<Quote>(() => FALLBACK_QUOTES[0]!);
  const [layout, setLayout] = useState<LayoutId>("slash-stack");
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

  const ariaLabel = `Expressive typographic poster with wild angles and overlapping type. Quote: "${quote.quote}" by ${quote.author}.`;

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
          . Angular generative typography. MIT licensed.
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
