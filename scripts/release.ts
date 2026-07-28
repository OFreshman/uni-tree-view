// @env node

import { execFileSync, spawnSync } from "node:child_process";
import process from "node:process";

function assertReleaseBranch(): void {
  const branch = execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8"
  }).trim();

  if (branch !== "main") {
    throw new Error(`Releases must be created from main, received ${branch || "detached HEAD"}`);
  }
}

function assertCleanWorkingTree(): void {
  const status = execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8"
  }).trim();

  if (status) {
    throw new Error(`Git working tree must be clean before releasing:\n${status}`);
  }
}

function main(): void {
  assertReleaseBranch();
  assertCleanWorkingTree();

  const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(pnpmCommand, ["exec", "bumpp", ...process.argv.slice(2)], {
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}