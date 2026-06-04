import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { apps } from "../src/lib/creative/registry.generated";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Home (catalog + filters) and every app's detail + play route.
const ROUTES: string[] = ["/", ...apps.flatMap((a) => [`/${a.slug}`, `/${a.slug}/play`])];

for (const route of ROUTES) {
  test(`no WCAG A/AA violations: ${route}`, async ({ page }) => {
    await page.goto(route);
    // Let client canvases/effects mount so axe sees the real DOM.
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      // Canvas/WebGL/iframe sketches render visual-only content; exclude the
      // embedded preview iframe (it is audited on its own /play route).
      .exclude("iframe")
      .analyze();

    const summary = results.violations
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) - ${v.help}`)
      .join("\n");
    expect(results.violations, summary).toEqual([]);
  });
}
