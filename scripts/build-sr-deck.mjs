#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildRegistry, findMetaFiles } from "./build-app-registry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const appsDir = path.join(repoRoot, "src", "app");
const outFile = path.join(repoRoot, "src", "lib", "creative", "registry.generated.ts");

export function csvField(value) {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function csvRow(fields) {
  return fields.map(csvField).join(",");
}

async function parseMeta(file) {
  const src = await fs.readFile(file, "utf8");

  const slugMatch = src.match(/slug\s*:\s*["']([^"']+)["']/);
  const levelMatch = src.match(/level\s*:\s*([123])/);

  const conceptsMatch = src.match(/concepts\s*:\s*\[([^\]]*)\]/s);
  const concepts = [];
  if (conceptsMatch) {
    const inner = conceptsMatch[1];
    const strings = [...inner.matchAll(/["']([^"']+)["']/g)];
    for (const m of strings) {
      if (m[1]) concepts.push(m[1]);
    }
  }

  const recallChecksMatch = src.match(/recallChecks\s*:\s*\[([\s\S]*?)\]/);
  const recallChecks = [];
  if (recallChecksMatch) {
    const inner = recallChecksMatch[1];
    const qMatches = [...inner.matchAll(/q\s*:\s*["'`]([\s\S]*?)["'`]/g)];
    const aMatches = [...inner.matchAll(/a\s*:\s*["'`]([\s\S]*?)["'`]/g)];
    const len = Math.min(qMatches.length, aMatches.length);
    for (let i = 0; i < len; i++) {
      const q = qMatches[i]?.[1];
      const a = aMatches[i]?.[1];
      if (q && a) recallChecks.push({ q, a });
    }
  }

  return {
    slug: slugMatch?.[1] ?? "",
    level: levelMatch ? Number(levelMatch[1]) : 1,
    concepts,
    recallChecks,
  };
}

async function buildSrDeck() {
  await buildRegistry({ appsDir, outFile });

  const metaFiles = await findMetaFiles(appsDir);

  const rows = [];
  let cardCount = 0;
  let appCount = 0;

  for (const { slug, file } of metaFiles) {
    const meta = await parseMeta(file);
    if (!meta.recallChecks || meta.recallChecks.length === 0) continue;

    appCount++;
    const conceptTags = meta.concepts.map((c) => `concept:${c}`).join(" ");
    const tags = ["cc-library", `slug:${slug}`, `level:L${meta.level}`, conceptTags]
      .filter(Boolean)
      .join(" ");

    for (const { q, a } of meta.recallChecks) {
      rows.push(csvRow([q, a, tags]));
      cardCount++;
    }
  }

  const header = csvRow(["front", "back", "tags"]);
  const csv = [header, ...rows].join("\n") + "\n";

  const outDir = path.join(repoRoot, "public", "decks");
  await fs.mkdir(outDir, { recursive: true });
  const csvPath = path.join(outDir, "cc-library.csv");
  await fs.writeFile(csvPath, csv, "utf8");

  process.stdout.write(
    `sr-deck: ${cardCount} cards from ${appCount} apps -> public/decks/cc-library.csv\n`,
  );
}

buildSrDeck().catch((err) => {
  console.error(err);
  process.exit(1);
});
