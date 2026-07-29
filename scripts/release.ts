// @env node

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";
import chalk from "chalk";
import { assertUnreleasedHasContent } from "./changelog-utils";

function getCurrentHead(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8"
  }).trim();
}

function assertReleaseBranch(): string {
  const branch = execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8"
  }).trim();

  if (branch !== "main") {
    throw new Error(`Releases must be created from main, received ${branch || "detached HEAD"}`);
  }

  return branch;
}

function assertCleanWorkingTree(): void {
  const status = execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8"
  }).trim();

  if (status) {
    throw new Error(`Git working tree must be clean before releasing:\n${status}`);
  }
}

function assertChangelogReady(): void {
  assertUnreleasedHasContent(readFileSync("CHANGELOG.md", "utf8"));
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args].join(" ");
}

function restoreFailedRelease(originalHead: string): void {
  if (getCurrentHead() !== originalHead) {
    console.error(chalk.yellow("Release created a commit before failing; automatic file rollback was skipped."));
    return;
  }

  const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
    encoding: "utf8"
  }).trim();
  if (!status) {
    return;
  }

  execFileSync("git", ["restore", "--staged", "--worktree", "--", "."], {
    stdio: "inherit"
  });
  console.log(chalk.yellow("Restored tracked files changed by the failed release."));
}

function main(): void {
  const branch = assertReleaseBranch();
  assertCleanWorkingTree();
  assertChangelogReady();
  const originalHead = getCurrentHead();

  const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const releaseArgs = process.argv.slice(2);
  const bumppArgs = ["exec", "bumpp", ...(releaseArgs.length ? releaseArgs : ["prompt"])];

  console.log();
  console.log(chalk.bold.cyan("Release uni-tree-view"));
  console.log(`${chalk.dim("branch ")} ${chalk.green(branch)}`);
  console.log(`${chalk.dim("command")} ${chalk.yellow(formatCommand("pnpm", bumppArgs))}`);
  if (!releaseArgs.length) {
    console.log(chalk.dim("Use the arrow keys to select a version, then press Enter."));
  }
  console.log();

  const result = spawnSync(pnpmCommand, bumppArgs, {
    env: {
      ...process.env,
      GIT_PAGER: "cat"
    },
    stdio: "inherit"
  });

  if (result.error) {
    restoreFailedRelease(originalHead);
    throw result.error;
  }

  if (result.status !== 0) {
    restoreFailedRelease(originalHead);
    throw new Error(`${formatCommand("pnpm", bumppArgs)} exited with status ${result.status ?? 1}`);
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n${chalk.red.bold("Release failed:")} ${chalk.red(message)}`);
  process.exitCode = 1;
}