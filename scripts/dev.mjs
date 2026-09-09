#!/usr/bin/env node
// Dev runner: regenerates the app registry whenever an app.meta.ts changes, then
// runs `next dev`. Without this, adding or renaming an app while the dev server
// is running would 404 until a manual restart, because the registry is only
// built once at startup. Fast Refresh already handles ordinary code edits; this
// covers the one change it cannot, the generated catalog.
import { spawn } from "node:child_process";
import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRegistry } from "./build-app-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const appsDir = path.join(repoRoot, "src", "app");
const outFile = path.join(repoRoot, "src", "lib", "creative", "registry.generated.ts");

async function regen() {
  try {
    const { count } = await buildRegistry({ appsDir, outFile });
    process.stdout.write(`[registry] ${count} app(s)\n`);
  } catch (err) {
    console.error("[registry] regenerate failed:", err);
  }
}

await regen();

// Re-run the registry build when any app.meta.ts is added, changed, or removed.
let timer = null;
try {
  watch(appsDir, { recursive: true }, (_event, file) => {
    if (!file || !String(file).endsWith("app.meta.ts")) return;
    clearTimeout(timer);
    timer = setTimeout(regen, 150);
  });
} catch (err) {
  console.error("[registry] watch unavailable, registry will not auto-update:", err);
}

// Pass through any extra args (e.g. --port 3100 from the e2e web server).
const child = spawn("pnpm", ["exec", "next", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: repoRoot,
});
child.on("exit", (code) => process.exit(code ?? 0));
