"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import type { AppMeta } from "@/lib/creative/registry";
import { useMastery } from "@/lib/creative/useMastery";
import { MasteryButton } from "@/components/learning/MasteryButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NODE_W = 160;
const NODE_H = 130;
const MASTERY_KEY = "creative-coding-library:mastery:v1";
const HINT_KEY = "creative-coding-library:dag-hint-dismissed:v1";

type AppNodeData = {
  app: AppMeta;
  masteredSlugs: Set<string>;
  titleBySlug: Map<string, string>;
};

type AppNode = Node<AppNodeData, "app">;

function readMasteredSlugs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(MASTERY_KEY);
    if (raw === null) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return new Set();
    const store = parsed as Record<string, unknown>;
    const mastered = new Set<string>();
    for (const [slug, entry] of Object.entries(store)) {
      if (typeof entry === "object" && entry !== null && "mastered" in entry) {
        const e = entry as { mastered: unknown };
        if (e.mastered === true) mastered.add(slug);
      }
    }
    return mastered;
  } catch {
    return new Set();
  }
}

function useMasteredSlugs(): Set<string> {
  const [mastered, setMastered] = useState<Set<string>>(() => readMasteredSlugs());
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== MASTERY_KEY) return;
      setMastered(readMasteredSlugs());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return mastered;
}

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getPrefersReducedMotion);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function AppNodeComponent({ data }: NodeProps<AppNode>) {
  const { app, masteredSlugs, titleBySlug } = data;
  const { mastered } = useMastery(app.slug);
  const missingPrereqs = (app.prereqs ?? []).filter((p) => !masteredSlugs.has(p));
  const isLocked = missingPrereqs.length > 0;
  const missingTitles = missingPrereqs.map((p) => titleBySlug.get(p) ?? p).join(", ");

  return (
    <div style={{ width: NODE_W, height: NODE_H }}>
      <Link
        href={`/${app.slug}`}
        tabIndex={0}
        className={[
          "group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isLocked ? "opacity-40" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-describedby={isLocked ? `dag-lock-${app.slug}` : undefined}
      >
        <Card
          size="sm"
          className={[
            "h-full transition",
            mastered ? "ring-1 ring-green-500/60 bg-green-500/5" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-xs leading-tight line-clamp-2">{app.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1 pt-0">
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
        <span id={`dag-lock-${app.slug}`} className="sr-only">
          Locked. Complete first: {missingTitles}
        </span>
      )}
      <div className="mt-1">
        <MasteryButton slug={app.slug} understandWhen={app.understandWhen} />
      </div>
    </div>
  );
}

const nodeTypes = { app: AppNodeComponent };

const elk = new ELK();

async function computeElkLayout(
  apps: readonly AppMeta[],
): Promise<{ nodes: AppNode[]; edges: Edge[] }> {
  const slugs = new Set(apps.map((a) => a.slug));
  const elkEdges = apps.flatMap((app) =>
    (app.prereqs ?? [])
      .filter((p) => slugs.has(p))
      .map((p) => ({
        id: `${p}->${app.slug}`,
        sources: [p],
        targets: [app.slug],
      })),
  );

  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.padding": "[top=20,left=20,bottom=20,right=20]",
    },
    children: apps.map((app) => ({
      id: app.slug,
      width: NODE_W,
      height: NODE_H + 40,
    })),
    edges: elkEdges,
  };

  const laidOut = await elk.layout(elkGraph);

  const nodes: AppNode[] = [];
  for (const child of laidOut.children ?? []) {
    const app = apps.find((a) => a.slug === child.id);
    if (app === undefined) continue;
    nodes.push({
      id: child.id,
      type: "app",
      position: { x: child.x ?? 0, y: child.y ?? 0 },
      data: {
        app,
        masteredSlugs: new Set<string>(),
        titleBySlug: new Map<string, string>(),
      },
    });
  }

  const edges: Edge[] = elkEdges.map((e) => ({
    id: e.id,
    source: e.sources[0] ?? "",
    target: e.targets[0] ?? "",
    style: { stroke: "currentColor", strokeOpacity: 0.3, strokeWidth: 1.5 },
    focusable: false,
    "aria-hidden": "true",
  }));

  return { nodes, edges };
}

function topoOrder(apps: readonly AppMeta[]): AppMeta[] {
  const slugs = new Set(apps.map((a) => a.slug));
  const inDeg = new Map<string, number>();
  const children = new Map<string, string[]>();
  for (const a of apps) {
    if (!inDeg.has(a.slug)) inDeg.set(a.slug, 0);
    if (!children.has(a.slug)) children.set(a.slug, []);
    for (const p of (a.prereqs ?? []).filter((p) => slugs.has(p))) {
      inDeg.set(a.slug, (inDeg.get(a.slug) ?? 0) + 1);
      const ch = children.get(p) ?? [];
      ch.push(a.slug);
      children.set(p, ch);
    }
  }
  const queue: string[] = [];
  for (const a of apps) {
    if ((inDeg.get(a.slug) ?? 0) === 0) queue.push(a.slug);
  }
  const order: string[] = [];
  while (queue.length > 0) {
    const slug = queue.shift()!;
    order.push(slug);
    for (const child of children.get(slug) ?? []) {
      const d = (inDeg.get(child) ?? 1) - 1;
      inDeg.set(child, d);
      if (d === 0) queue.push(child);
    }
  }
  const bySlug = new Map(apps.map((a) => [a.slug, a]));
  const sorted = order.map((s) => bySlug.get(s)).filter((a): a is AppMeta => a !== undefined);
  const remaining = apps.filter((a) => !order.includes(a.slug));
  return [...sorted, ...remaining];
}

function DagInner({ apps }: { apps: readonly AppMeta[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const { fitView } = useReactFlow();
  const reducedMotion = usePrefersReducedMotion();
  const masteredSlugs = useMasteredSlugs();
  const [showHint, setShowHint] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.localStorage.getItem(HINT_KEY) !== null) return false;
    if (typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  });

  const titleBySlug = useMemo(() => new Map(apps.map((a) => [a.slug, a.title])), [apps]);

  const topoApps = useMemo(() => topoOrder(apps), [apps]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    computeElkLayout(apps).then(({ nodes: layoutNodes, edges: layoutEdges }) => {
      if (cancelled) return;
      setNodes(layoutNodes);
      setEdges(layoutEdges);
      setLayoutReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [apps, setNodes, setEdges]);

  useEffect(() => {
    if (!layoutReady) return;
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, masteredSlugs, titleBySlug },
      })),
    );
  }, [masteredSlugs, titleBySlug, layoutReady, setNodes]);

  useEffect(() => {
    if (layoutReady) {
      fitView({ padding: 0.2, duration: reducedMotion ? 0 : 300 });
    }
  }, [layoutReady, fitView, reducedMotion]);

  const handleResetView = useCallback(() => {
    fitView({ padding: 0.2, duration: reducedMotion ? 0 : 300 });
  }, [fitView, reducedMotion]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {showHint && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-xs shadow"
          onClick={dismissHint}
          onPointerDown={dismissHint}
        >
          Drag to pan, pinch to zoom
        </div>
      )}

      <div className="absolute top-2 right-2 z-10">
        <button
          type="button"
          onClick={handleResetView}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs shadow transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Reset view
        </button>
      </div>

      {!layoutReady && (
        <div
          role="status"
          aria-label="Computing layout"
          className="absolute inset-0 flex items-center justify-center bg-background/60 z-20"
        >
          <span className="text-sm text-foreground/60">Loading layout…</span>
        </div>
      )}

      <div className="min-h-0 flex-1" onPointerDown={dismissHint}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2.5}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          nodesFocusable={true}
          disableKeyboardA11y={false}
          panOnScroll={false}
          zoomOnPinch={true}
          panOnDrag={true}
          proOptions={{ hideAttribution: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <Background />
          <Controls position="bottom-right" />
          <MiniMap className="hidden md:block" nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>

      <details id="journey-dag-list" className="border-t border-border">
        <summary className="cursor-pointer px-4 py-2 text-sm font-medium hover:bg-accent">
          Show as list
        </summary>
        <ol className="space-y-1 px-4 py-3 text-sm">
          {topoApps.map((app) => (
            <li key={app.slug}>
              <Link
                href={`/${app.slug}`}
                className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {app.title}
              </Link>
              {(app.prereqs ?? []).length > 0 && (
                <span className="ml-2 text-xs text-foreground/50">
                  requires: {(app.prereqs ?? []).map((p) => titleBySlug.get(p) ?? p).join(", ")}
                </span>
              )}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

export function JourneyDag({ apps }: { apps: readonly AppMeta[] }) {
  return (
    <ReactFlowProvider>
      <DagInner apps={apps} />
    </ReactFlowProvider>
  );
}
