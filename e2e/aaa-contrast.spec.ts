import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import { apps } from "../src/lib/creative/registry.generated";

// Enforces WCAG AAA enhanced text contrast (1.4.6, 7:1) on every route, on top
// of the AA suite in a11y.spec.ts. Borders/outlines are non-text (1.4.11, AA)
// and are not covered by this rule.
const ROUTES: string[] = ["/", ...apps.flatMap((a) => [`/${a.slug}`, `/${a.slug}/play`])];

for (const route of ROUTES) {
  test(`no WCAG AAA text-contrast violations: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);

    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast-enhanced"])
      .exclude("iframe")
      .analyze();

    if (results.violations.length > 0) {
      fs.mkdirSync("e2e-results", { recursive: true });
      const detail = results.violations.flatMap((v) =>
        v.nodes.map((n) => ({
          html: n.html.slice(0, 160),
          data: [...n.any, ...n.all].map((c) => c.data),
        })),
      );
      fs.writeFileSync(
        `e2e-results/aaa_${(route.replace(/\W+/g, "_") || "home").replace(/^_|_$/g, "")}.json`,
        JSON.stringify(detail, null, 2),
      );
    }
    const summary = results.violations
      .map((v) => `${v.id}: ${v.nodes.length} node(s) below 7:1`)
      .join("\n");
    expect(results.violations, summary).toEqual([]);
  });
}
