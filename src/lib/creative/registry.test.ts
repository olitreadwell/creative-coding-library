import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  buildRegistry,
  toImportIdentifier,
  toImportPath,
  findMetaFiles,
  renderRegistry,
} from "../../../scripts/build-app-registry.mjs";

describe("toImportIdentifier", () => {
  it("prefixes with meta_ and replaces non-alphanumerics with _", () => {
    expect(toImportIdentifier("hello-world")).toBe("meta_hello_world");
    expect(toImportIdentifier("noise.field")).toBe("meta_noise_field");
  });
  it("prefixes leading digit with underscore so identifier is valid", () => {
    expect(toImportIdentifier("3d-grid")).toBe("meta__3d_grid");
  });
});

describe("toImportPath", () => {
  it("returns ts-extensionless POSIX path relative to the generated file", () => {
    const out = "/repo/src/lib/creative/registry.generated.ts";
    const file = "/repo/src/app/foo/app.meta.ts";
    expect(toImportPath(file, out)).toBe("../../app/foo/app.meta");
  });
});

describe("findMetaFiles", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "registry-test-"));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("returns [] for a missing dir", async () => {
    const result = await findMetaFiles(path.join(dir, "nope"));
    expect(result).toEqual([]);
  });

  it("finds app.meta.ts under each subfolder, sorted by slug", async () => {
    await fs.mkdir(path.join(dir, "b-app"), { recursive: true });
    await fs.writeFile(path.join(dir, "b-app", "app.meta.ts"), "export const meta = {};");
    await fs.mkdir(path.join(dir, "a-app"), { recursive: true });
    await fs.writeFile(path.join(dir, "a-app", "app.meta.ts"), "export const meta = {};");
    await fs.mkdir(path.join(dir, "_internal"), { recursive: true });
    await fs.writeFile(path.join(dir, "_internal", "app.meta.ts"), "export const meta = {};");
    await fs.mkdir(path.join(dir, "no-meta"), { recursive: true });

    const found = await findMetaFiles(dir);
    expect(found.map((f) => f.slug)).toEqual(["a-app", "b-app"]);
  });
});

describe("renderRegistry", () => {
  it("emits an empty array when no apps are found", () => {
    const out = renderRegistry([], "/tmp/out.ts");
    expect(out).toContain("export const apps: readonly AppMeta[] = []");
    expect(out).not.toContain("import { meta as");
  });

  it("emits an import + array entry for each app", () => {
    const out = renderRegistry(
      [{ slug: "hello", file: "/repo/src/app/hello/app.meta.ts" }],
      "/repo/src/lib/creative/registry.generated.ts",
    );
    expect(out).toContain('import { meta as meta_hello } from "../../app/hello/app.meta";');
    expect(out).toContain("meta_hello,");
  });
});

describe("buildRegistry (e2e)", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "registry-build-"));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("writes the generated file with the correct apps list", async () => {
    const appsDir = path.join(dir, "src/app");
    const outFile = path.join(dir, "src/lib/creative/registry.generated.ts");
    await fs.mkdir(path.join(appsDir, "hello"), { recursive: true });
    await fs.writeFile(path.join(appsDir, "hello", "app.meta.ts"), "export const meta = {};");

    const result = await buildRegistry({ appsDir, outFile });
    expect(result.count).toBe(1);

    const written = await fs.readFile(outFile, "utf8");
    expect(written).toContain("meta_hello");
  });
});

describe("generated registry import surface", () => {
  it("exports an array (possibly empty)", async () => {
    const mod = await import("./registry.generated");
    expect(Array.isArray(mod.apps)).toBe(true);
  });
});
