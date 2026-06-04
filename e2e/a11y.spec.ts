import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import { apps } from "../src/lib/creative/registry.generated";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Home (catalog + filters) and every app's detail + play route.
const ROUTES: string[] = ["/", ...apps.flatMap((a) => [`/${a.slug}`, `/${a.slug}/play`])];

for (const route of ROUTES) {
  test(`no WCAG A/AA violations: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    // Let client canvases/effects mount so axe sees the real DOM. We avoid
    // networkidle because the dev HMR socket keeps the network "busy".
    await page.waitForTimeout(900);

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      // Canvas/WebGL/iframe sketches render visual-only content; exclude the
      // embedded preview iframe (it is audited on its own /play route).
      .exclude("iframe")
      .analyze();

    if (results.violations.length > 0) {
      fs.mkdirSync("e2e-results", { recursive: true });
      const detail = results.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          html: n.html.slice(0, 180),
          data: [...n.any, ...n.all].map((c) => c.data),
        })),
      }));
      fs.writeFileSync(
        `e2e-results/${(route.replace(/\W+/g, "_") || "home").replace(/^_|_$/g, "")}.json`,
        JSON.stringify(detail, null, 2),
      );
    }
    const summary = results.violations
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) - ${v.help}`)
      .join("\n");
    expect(results.violations, summary).toEqual([]);
  });
}
