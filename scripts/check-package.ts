// @env node

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { getPnpmCommand } from "./pnpm-utils";

export const NpmPackageName = "uni-tree-view";
// 此上限只防止分发压缩包意外膨胀；实际运行体积由 check:size 的最小工程对照检查。
export const MaxPackedBytes = 50 * 1024;

export interface PackageManifest {
  name: string;
  version: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bundledDependencies?: string[] | boolean;
  bundleDependencies?: string[] | boolean;
  exports?: unknown;
}

export interface PackReport {
  name: string;
  version: string;
  filename: string;
  files: { path: string }[];
}

export function parsePackReport(output: string): PackReport {
  // prepack（打包前执行的脚本）的日志位于 JSON 之前；最终打包报告从顶格的 { 开始。
  const report = JSON.parse(output.slice(output.lastIndexOf("\n{") + 1)) as Partial<PackReport>;
  if (typeof report.name !== "string" || typeof report.version !== "string"
    || typeof report.filename !== "string" || !Array.isArray(report.files)
    || !report.files.every((file) => file && typeof file.path === "string")) {
    throw new Error("pnpm pack did not return a valid package report.");
  }
  return report as PackReport;
}

function isAllowedPackageFile(file: string): boolean {
  if (["package.json", "README.md", "CHANGELOG.md", "LICENSE"].includes(file)) {
    return true;
  }
  if (file.includes("\\") || path.posix.isAbsolute(file)
    || file.split("/").some((part) => part.startsWith(".") || ["test", "tests", "__tests__", "fixtures", "node_modules"].includes(part))) {
    return false;
  }
  return /^src\/.+\.(?:js|ts|vue|scss)$/.test(file)
    || file === "dist/index.d.ts"
    || /^dist-resolver\/index\.(?:mjs|cjs|d\.(?:ts|mts|cts))$/.test(file);
}

function assertExportTargets(target: unknown, files: Set<string>): void {
  if (typeof target === "string") {
    if (!target.startsWith("./") || !files.has(target.slice(2))) {
      throw new Error(`Package export is missing from the tarball: ${target}`);
    }
    return;
  }
  if (!target || typeof target !== "object" || Object.keys(target).length === 0) {
    throw new Error("Package exports must point to published files.");
  }
  for (const entry of Object.values(target)) {
    assertExportTargets(entry, files);
  }
}

export function assertPackedPackage(
  manifest: PackageManifest,
  report: PackReport,
  packedBytes: number,
  sourceFiles: string[] = []
): void {
  if (manifest.name !== NpmPackageName || manifest.private === true
    || report.name !== manifest.name || report.version !== manifest.version) {
    throw new Error("Only the matching public packages/core package may be packed.");
  }
  for (const dependencies of [manifest.dependencies, manifest.optionalDependencies]) {
    if (Object.keys(dependencies ?? {}).length > 0) {
      throw new Error("The core package must remain free of runtime dependencies.");
    }
  }
  for (const bundled of [manifest.bundledDependencies, manifest.bundleDependencies]) {
    if (bundled === true || (Array.isArray(bundled) && bundled.length > 0)) {
      throw new Error("The core package must not bundle runtime dependencies.");
    }
  }

  const files = new Set(report.files.map((file) => file.path));
  if (files.size !== report.files.length) {
    throw new Error("The package report contains duplicate files.");
  }
  for (const file of files) {
    if (!isAllowedPackageFile(file)) {
      throw new Error(`Unexpected file in the npm package: ${file}`);
    }
  }
  for (const file of ["package.json", "README.md", "CHANGELOG.md", "LICENSE", ...sourceFiles]) {
    if (!files.has(file)) {
      throw new Error(`Required file is missing from the npm package: ${file}`);
    }
  }
  assertExportTargets(manifest.exports, files);

  if (!Number.isSafeInteger(packedBytes) || packedBytes <= 0 || packedBytes > MaxPackedBytes) {
    throw new Error(`Packed npm size ${packedBytes} bytes exceeds the ${MaxPackedBytes}-byte budget or is invalid. Review package contents before changing the budget.`);
  }
}

export function collectSourceFiles(directory: string, prefix = "src"): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    // pnpm pack 固定忽略 Finder 元数据；其余文件仍须经过完整的分发校验。
    if (entry.name === ".DS_Store") {
      return [];
    }
    const file = `${prefix}/${entry.name}`;
    return entry.isDirectory()
      ? collectSourceFiles(path.join(directory, entry.name), file)
      : [file];
  });
}

function main(): void {
  const root = process.cwd();
  const rootPackage = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as PackageManifest;
  if (rootPackage.private !== true) {
    throw new Error("The workspace root must remain private.");
  }
  const core = path.join(root, "packages", "core");
  const manifest = JSON.parse(readFileSync(path.join(core, "package.json"), "utf8")) as PackageManifest;
  const destination = path.join(root, "artifacts", "npm");
  const pnpm = getPnpmCommand([
    "--filter",
    "./packages/core",
    "pack",
    "--json",
    "--pack-destination",
    destination
  ]);
  const result = spawnSync(pnpm.command, pnpm.args, {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`pnpm pack failed (${result.status ?? result.signal}):\n${result.stdout}\n${result.stderr}`);
  }

  const report = parsePackReport(result.stdout);
  const expectedTarball = path.join(destination, `${manifest.name}-${manifest.version}.tgz`);
  if (path.resolve(report.filename) !== expectedTarball) {
    throw new Error(`Unexpected npm tarball path: ${report.filename}`);
  }
  const packedBytes = statSync(expectedTarball).size;
  assertPackedPackage(manifest, report, packedBytes, collectSourceFiles(path.join(core, "src")));
  console.log(`npm package check passed: ${report.files.length} files, ${packedBytes} bytes / ${MaxPackedBytes} bytes budget.`);
  console.log(`Validated tarball: ${path.relative(root, expectedTarball)}`);
}

// 导入函数做单元测试时不执行命令；只有直接运行此文件才启动检查。
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}