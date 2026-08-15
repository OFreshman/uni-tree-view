// @env node

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const generatedTargets = [
  path.join(root, "packages", "core", "README.md"),
  path.join(root, "packages", "core", "dist-resolver")
];

// 以 base64 记录内容，既能逐字节比对，也不必依赖 Buffer 全局对象。
type OutputSnapshot = Map<string, string>;

function snapshotTargets(): OutputSnapshot {
  const snapshot: OutputSnapshot = new Map();
  for (const target of generatedTargets) {
    collectFiles(target, snapshot);
  }
  return snapshot;
}

function collectFiles(target: string, snapshot: OutputSnapshot): void {
  if (!existsSync(target)) {
    return;
  }

  if (statSync(target).isDirectory()) {
    for (const entry of readdirSync(target).sort()) {
      collectFiles(path.join(target, entry), snapshot);
    }
    return;
  }

  snapshot.set(path.relative(root, target), readFileSync(target, "base64"));
}

function changedPaths(before: OutputSnapshot, after: OutputSnapshot): string[] {
  const paths = new Set([...before.keys(), ...after.keys()]);
  return [...paths]
    .filter((filePath) => before.get(filePath) !== after.get(filePath))
    .sort();
}

function runBuild(): void {
  const pnpmCli = process.env.npm_execpath;
  const command = pnpmCli
    ? process.execPath
    : process.platform === "win32"
      ? "pnpm.cmd"
      : "pnpm";
  const args = pnpmCli
    ? [pnpmCli, "run", "build:play"]
    : ["run", "build:play"];
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const before = snapshotTargets();
runBuild();
const changed = changedPaths(before, snapshotTargets());

if (changed.length > 0) {
  console.error("Build updated tracked generated outputs:");
  for (const filePath of changed) {
    console.error(`- ${filePath}`);
  }
  console.error("Keep the generated updates, review them, then run pnpm check again.");
  process.exit(1);
}

console.log("Tracked build outputs are up to date.");