import { test, expect } from "@playwright/test";
import { apps } from "../src/lib/creative/registry.generated";

// Functional smoke tests: catch the failures axe/a11y cannot — blank canvases,
// wrong-sized ("zoomed"/"strip") canvases, canvases that grow every frame, and
// sketches that should animate but are frozen. Run at a small viewport to mimic
// the embedded detail-page preview, where sizing bugs surface.
test.use({ viewport: { width: 480, height: 360 } });

// Sketches expected to animate continuously (autoplay). Excludes static-by-
// design (seeded-tilings) and run-to-completion (maze) sketches.
const ANIMATED = new Set([
  "boids",
  "conway-life",
  "fourier-epicycles",
  "gsap-stagger",
  "lissajous",
  "metaballs",
  "noise-field",
  "physics-drops",
  "r3f-spheres",
  "reaction-diffusion",
  "shader-gradient",
  "two-grid",
  "wireframe",
  "strange-attractor",
  "phyllotaxis",
  "voronoi",
  "superformula",
  "cyclic-ca",
  "tile-pulse",
  "physarum",
  "mondrian",
]);

// Console noise that is not an app defect.
const IGNORE_CONSOLE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /webgl/i,
  // External-API hiccups (e.g. the live quotes API) are not app defects.
  /Failed to fetch/i,
  /Failed to load resource/i,
  /net::/i,
  /dummyjson/i,
];

type CanvasMetrics = {
  hasCanvas: boolean;
  boxW: number;
  boxH: number;
  bufW: number;
  bufH: number;
  dpr: number;
};

async function measure(page: import("@playwright/test").Page): Promise<CanvasMetrics> {
  return page.evaluate(() => {
    const c = document.querySelector("canvas");
    const dpr = window.devicePixelRatio || 1;
    if (!c) return { hasCanvas: false, boxW: 0, boxH: 0, bufW: 0, bufH: 0, dpr };
    const r = c.getBoundingClientRect();
    return {
      hasCanvas: true,
      boxW: Math.round(r.width),
      boxH: Math.round(r.height),
      bufW: c.width,
      bufH: c.height,
      dpr,
    };
  });
}

for (const app of apps) {
  const slug = app.slug;

  test(`smoke: /${slug}/play`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      if (IGNORE_CONSOLE.some((re) => re.test(t))) return;
      errors.push(t.slice(0, 200));
    });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));

    await page.goto(`/${slug}/play`, { waitUntil: "domcontentloaded" });
    const visual = page.locator('[role="group"]').first();
    await visual.waitFor({ state: "visible", timeout: 10_000 });
    // Allow dev-mode compile + layout/ResizeObserver to settle before measuring.
    await page.waitForTimeout(1800);

    const m1 = await measure(page);

    if (m1.hasCanvas) {
      // Backing store must match the CSS box scaled by dpr (±4 device px).
      const tol = 4;
      expect(
        Math.abs(m1.bufW - m1.boxW * m1.dpr),
        `${slug}: canvas buffer width ${m1.bufW} != box ${m1.boxW}×dpr ${m1.dpr}`,
      ).toBeLessThanOrEqual(tol + m1.dpr);
      expect(
        Math.abs(m1.bufH - m1.boxH * m1.dpr),
        `${slug}: canvas buffer height ${m1.bufH} != box ${m1.boxH}×dpr ${m1.dpr}`,
      ).toBeLessThanOrEqual(tol + m1.dpr);
      // The canvas should actually fill its container, not collapse to a strip.
      expect(m1.boxH, `${slug}: canvas box height ${m1.boxH} too short`).toBeGreaterThan(120);
    }

    // Stability: once settled, nothing should keep growing (catches a real
    // overgrow/flash-resize loop). Compare two post-settle samples so a single
    // one-time layout settle (e.g. the control bar finishing wrapping) does not
    // count as overgrowth.
    await page.waitForTimeout(1200);
    const m2 = await measure(page);
    await page.waitForTimeout(1200);
    const m3 = await measure(page);
    if (m2.hasCanvas && m3.hasCanvas) {
      expect(
        Math.abs(m3.bufH - m2.bufH),
        `${slug}: canvas buffer height keeps changing ${m2.bufH} -> ${m3.bufH} (overgrowing)`,
      ).toBeLessThanOrEqual(2 + m1.dpr);
      expect(
        Math.abs(m3.boxH - m2.boxH),
        `${slug}: canvas box height keeps changing ${m2.boxH} -> ${m3.boxH}`,
      ).toBeLessThanOrEqual(2);
    }

    expect(errors, `${slug}: console errors:\n${errors.join("\n")}`).toEqual([]);
  });

  if (ANIMATED.has(slug)) {
    test(`animates: /${slug}/play`, async ({ page }) => {
      await page.goto(`/${slug}/play`, { waitUntil: "domcontentloaded" });
      const visual = page.locator('[role="group"]').first();
      await visual.waitFor({ state: "visible", timeout: 10_000 });
      await page.waitForTimeout(600);

      // The screenshot protocol call can transiently fail while a heavy frame
      // renders. Try a few times; if we can't capture two frames, skip rather
      // than fail (the smoke test above already proved the canvas renders).
      const shot = async (): Promise<Buffer | null> => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await page.screenshot();
          } catch {
            await page.waitForTimeout(150);
          }
        }
        return null;
      };

      const shots: Buffer[] = [];
      for (let i = 0; i < 3; i++) {
        const s = await shot();
        if (s) shots.push(s);
        await page.waitForTimeout(500);
      }
      if (shots.length < 2) {
        test.skip(true, `${slug}: could not capture frames to compare`);
        return;
      }
      const moved = shots.some((s, i) => i > 0 && !s.equals(shots[i - 1]!));
      expect(moved, `${slug}: sketch did not animate (frames identical)`).toBe(true);
    });
  }
}
