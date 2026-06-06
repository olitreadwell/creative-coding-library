"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { AppMeta } from "@/lib/creative/registry";
import { useMastery, useMasteredSlugs } from "@/lib/creative/useMastery";
import { MasteryButton } from "@/components/learning/MasteryButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NODE_W = 200;
const NODE_H = 140;
const COL_GAP = 80;
const ROW_GAP = 24;

type LayeredNode = {
  app: AppMeta;
  col: number;
  row: number;
};

function computeLayers(apps: readonly AppMeta[]): {
  nodes: LayeredNode[];
  hasCycle: boolean;
  degenerate: boolean;
} {
  const slugs = new Set(apps.map((a) => a.slug));
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const app of apps) {
    if (!inDegree.has(app.slug)) inDegree.set(app.slug, 0);
    if (!children.has(app.slug)) children.set(app.slug, []);
    const prereqs = (app.prereqs ?? []).filter((p) => slugs.has(p));
    for (const p of prereqs) {
      inDegree.set(app.slug, (inDegree.get(app.slug) ?? 0) + 1);
      const ch = children.get(p) ?? [];
      ch.push(app.slug);
      children.set(p, ch);
    }
  }

  const layer = new Map<string, number>();
  const queue: string[] = [];

  for (const app of apps) {
    if ((inDegree.get(app.slug) ?? 0) === 0) {
      queue.push(app.slug);
      layer.set(app.slug, 0);
    }
  }

  let processed = 0;
  while (queue.length > 0) {
    const slug = queue.shift()!;
    processed++;
    for (const child of children.get(slug) ?? []) {
      const newLayer = (layer.get(slug) ?? 0) + 1;
      if (newLayer > (layer.get(child) ?? 0)) {
        layer.set(child, newLayer);
      }
      inDegree.set(child, (inDegree.get(child) ?? 1) - 1);
      if ((inDegree.get(child) ?? 0) === 0) {
        queue.push(child);
      }
    }
  }

  const hasCycle = processed < apps.length;
  if (hasCycle) {
    for (const app of apps) {
      if (!layer.has(app.slug)) layer.set(app.slug, 0);
    }
  }

  const colGroups = new Map<number, AppMeta[]>();
  for (const app of apps) {
    const col = layer.get(app.slug) ?? 0;
    const group = colGroups.get(col) ?? [];
    group.push(app);
    colGroups.set(col, group);
  }

  const validPrereqs = apps.flatMap((a) => (a.prereqs ?? []).filter((p) => slugs.has(p)));
  const degenerate = validPrereqs.length === 0;

  const nodes: LayeredNode[] = [];
  for (const [col, group] of colGroups) {
    const sorted = [...group].sort((a, b) => a.title.localeCompare(b.title));
    sorted.forEach((app, row) => {
      nodes.push({ app, col, row });
    });
  }

  return { nodes, hasCycle, degenerate };
}

type EdgeCoord = { x1: number; y1: number; x2: number; y2: number };

function buildEdges(nodes: LayeredNode[]): EdgeCoord[] {
  const pos = new Map<string, { cx: number; cy: number }>();
  for (const n of nodes) {
    pos.set(n.app.slug, {
      cx: n.col * (NODE_W + COL_GAP) + NODE_W / 2,
      cy: n.row * (NODE_H + ROW_GAP) + NODE_H / 2,
    });
  }

  const slugs = new Set(nodes.map((n) => n.app.slug));
  const edges: EdgeCoord[] = [];
  for (const n of nodes) {
    for (const p of n.app.prereqs ?? []) {
      if (!slugs.has(p)) continue;
      const from = pos.get(p);
      const to = pos.get(n.app.slug);
      if (from !== undefined && to !== undefined) {
        edges.push({ x1: from.cx, y1: from.cy, x2: to.cx, y2: to.cy });
      }
    }
  }
  return edges;
}

function JourneyNode({ node, masteredSlugs }: { node: LayeredNode; masteredSlugs: Set<string> }) {
  const { app, col, row } = node;
  const { mastered } = useMastery(app.slug);

  const slugs = masteredSlugs;
  const missingPrereqs = (app.prereqs ?? []).filter((p) => !slugs.has(p));
  const isLocked = missingPrereqs.length > 0;
  const missingTitles = missingPrereqs.join(", ");

  const x = col * (NODE_W + COL_GAP);
  const y = row * (NODE_H + ROW_GAP);

  return (
    <div className="absolute" style={{ left: x, top: y, width: NODE_W }}>
      <Link
        href={`/${app.slug}`}
        className={[
          "group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isLocked ? "journey-node--locked opacity-40" : "",
          mastered ? "journey-node--mastered" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-describedby={isLocked ? `lock-${app.slug}` : undefined}
      >
        <Card
          size="sm"
          className={["h-full transition", mastered ? "ring-green-500/60 bg-green-500/5" : ""].join(
            " ",
          )}
        >
          <CardHeader>
            <CardTitle className="text-xs leading-tight line-clamp-2">{app.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">
              L{app.level}
            </Badge>
            {app.concepts[0] !== undefined && (
              <Badge variant="secondary" className="text-[10px]">
                {app.concepts[0]}
              </Badge>
            )}
          </CardContent>
        </Card>
      </Link>
      {isLocked && (
        <span id={`lock-${app.slug}`} className="sr-only">
          Locked. Complete first: {missingTitles}
        </span>
      )}
      <div className="mt-1">
        <MasteryButton slug={app.slug} understandWhen={app.understandWhen} />
      </div>
    </div>
  );
}

export function JourneyView({ apps }: { apps: readonly AppMeta[] }) {
  const { nodes, hasCycle, degenerate } = useMemo(() => computeLayers(apps), [apps]);
  const masteredSlugs = useMasteredSlugs();

  if (hasCycle) {
    console.warn("[JourneyView] Cycle detected in prereqs graph. Rendering in arbitrary order.");
  }

  const edges = useMemo(() => buildEdges(nodes), [nodes]);

  const maxCol = nodes.length > 0 ? Math.max(...nodes.map((n) => n.col)) : 0;
  const maxRow = nodes.length > 0 ? Math.max(...nodes.map((n) => n.row)) : 0;
  const svgW = (maxCol + 1) * (NODE_W + COL_GAP) - COL_GAP;
  const containerH = (maxRow + 1) * (NODE_H + ROW_GAP) - ROW_GAP + 48;

  return (
    <section aria-label="Learning journey">
      {degenerate && (
        <p className="mb-4 text-sm text-foreground/60">No prerequisites declared yet.</p>
      )}
      <div className="relative overflow-x-auto" style={{ minHeight: containerH }}>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          width={svgW}
          height={containerH}
          style={{ minWidth: svgW }}
        >
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="currentColor"
              strokeOpacity={0.25}
              strokeWidth={1.5}
            />
          ))}
        </svg>
        {nodes.map((n) => (
          <JourneyNode key={n.app.slug} node={n} masteredSlugs={masteredSlugs} />
        ))}
      </div>
    </section>
  );
}
