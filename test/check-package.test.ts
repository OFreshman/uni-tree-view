import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertPackedPackage, collectSourceFiles, MaxPackedBytes, parsePackReport } from "../scripts/check-package";
import type { PackageManifest, PackReport } from "../scripts/check-package";

function fixture() {
  const manifest: PackageManifest = {
    name: "uni-tree-view",
    version: "1.0.0",
    exports: {
      ".": {
        types: "./src/component.vue.d.ts",
        import: "./src/component.vue"
      },
      "./shared": {
        types: "./dist/index.d.ts",
        import: "./src/index.js"
      },
      "./resolver": {
        import: "./dist-resolver/index.mjs",
        require: "./dist-resolver/index.cjs"
      }
    }
  };
  const report: PackReport = {
    name: manifest.name,
    version: manifest.version,
    filename: "/tmp/uni-tree-view-1.0.0.tgz",
    files: [
      "package.json",
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
      "src/component.vue",
      "src/component.vue.d.ts",
      "src/index.js",
      "src/style/index.scss",
      "dist/index.d.ts",
      "dist-resolver/index.mjs",
      "dist-resolver/index.cjs"
    ].map((path) => ({ path }))
  };
  return { manifest, report };
}

describe("npm distribution checks", () => {
  it("ignores nested Finder metadata without weakening required source checks", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "uni-tree-view-package-"));
    try {
      mkdirSync(path.join(directory, "style"));
      for (const file of [".DS_Store", "style/.DS_Store", "style/index.scss"]) {
        writeFileSync(path.join(directory, file), "fixture\n");
      }
      const sourceFiles = collectSourceFiles(directory);
      expect(sourceFiles).toEqual(["src/style/index.scss"]);
      const { manifest, report } = fixture();
      expect(() => assertPackedPackage(manifest, report, 35_000, sourceFiles)).not.toThrow();
      report.files = report.files.filter((file) => file.path !== "src/style/index.scss");
      expect(() => assertPackedPackage(manifest, report, 35_000, sourceFiles))
        .toThrow("Required file is missing");

      writeFileSync(path.join(directory, ".hidden.ts"), "export {};\n");
      expect(collectSourceFiles(directory)).toContain("src/.hidden.ts");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("reads pnpm JSON with or without prepack logs", () => {
    const { report } = fixture();
    const json = JSON.stringify(report, null, 2);
    expect(parsePackReport(json)).toEqual(report);
    expect(parsePackReport(`> prepack\n{ earlier log }\nGenerated changelog\n${json}\n`)).toEqual(report);
  });

  it.each(["{}", "[]", "{\"files\":[null]}", "not json"])("rejects an invalid pack report: %s", (output) => {
    expect(() => parsePackReport(output)).toThrow();
  });

  it("accepts only the intended source/type/resolver distribution", () => {
    const { manifest, report } = fixture();
    expect(() => assertPackedPackage(manifest, report, 35_000, ["src/style/index.scss"]))
      .not
      .toThrow();
  });

  it.each([
    ["dependencies", { lodash: "1" }],
    ["optionalDependencies", { lodash: "1" }],
    ["bundledDependencies", ["lodash"]],
    ["bundleDependencies", true]
  ] as const)("rejects runtime dependency field %s", (field, value) => {
    const { manifest, report } = fixture();
    expect(() => assertPackedPackage({ ...manifest, [field]: value }, report, 35_000)).toThrow("runtime dependencies");
  });

  it.each([
    "docs/index.md",
    "test/core.test.ts",
    "node_modules/vue/index.js",
    "src/__tests__/core.ts",
    "src/style/font.ttf",
    "src/.env",
    "src/.DS_Store",
    "src/.hidden.ts",
    "src/../private.ts",
    "src\\private.ts",
    "dist/index.mjs",
    "dist-resolver/index.mjs.map"
  ])("rejects unintended payload: %s", (path) => {
    const { manifest, report } = fixture();
    report.files.push({ path });
    expect(() => assertPackedPackage(manifest, report, 35_000)).toThrow("Unexpected file");
  });

  it.each(["README.md", "LICENSE", "CHANGELOG.md", "package.json", "src/style/index.scss"])("requires %s", (path) => {
    const { manifest, report } = fixture();
    report.files = report.files.filter((file) => file.path !== path);
    expect(() => assertPackedPackage(manifest, report, 35_000, ["src/style/index.scss"]))
      .toThrow("Required file is missing");
  });

  it("checks every conditional export, including declarations and CommonJS", () => {
    const { manifest, report } = fixture();
    for (const missing of ["src/component.vue.d.ts", "dist-resolver/index.cjs"]) {
      const withoutExport = { ...report, files: report.files.filter((file) => file.path !== missing) };
      expect(() => assertPackedPackage(manifest, withoutExport, 35_000)).toThrow("Package export is missing");
    }
  });

  it("rejects a private root or mismatched package version", () => {
    const { manifest, report } = fixture();
    expect(() => assertPackedPackage({ ...manifest, private: true }, report, 35_000)).toThrow("matching public");
    expect(() => assertPackedPackage(manifest, { ...report, version: "0.6.4" }, 35_000)).toThrow("matching public");
  });

  it.each([0, Number.NaN, MaxPackedBytes + 1])("enforces the measured tarball size budget: %s", (size) => {
    const { manifest, report } = fixture();
    expect(() => assertPackedPackage(manifest, report, size)).toThrow("budget");
  });

  it("accepts the budget boundary", () => {
    const { manifest, report } = fixture();
    expect(() => assertPackedPackage(manifest, report, MaxPackedBytes)).not.toThrow();
  });
});