// @env node

import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import chalk from "chalk";
import { readReleaseCommits } from "./changelog-git";
import {
  assertChangelogCanBePrepared,
  createChangelogPreparation
} from "./changelog-utils";
import { getPnpmCommand } from "./pnpm-utils";

export function getReleaseInfo(tag: string, versions: Record<string, string>) {
  const version = versions["packages/core"];
  if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Z.-]+)?(?:\+[0-9A-Z.-]+)?$/i.test(version)) {
    throw new Error(`Invalid component release version: ${version}`);
  }
  for (const [name, candidate] of Object.entries(versions)) {
    if (candidate !== version) {
      throw new Error(`${name} version ${candidate} does not match the component version ${version}.`);
    }
  }
  if (tag !== `v${version}`) {
    throw new Error(`Expected release tag v${version}, received ${tag}.`);
  }
  // npm dist-tag 是安装通道标签：latest 用于正式版，next 用于预发布版。
  const prerelease = version.split("+", 1)[0].includes("-");
  return {
    version,
    prerelease,
    npmTag: prerelease ? "next" : "latest",
    artifact: `artifacts/npm/uni-tree-view-${version}.tgz`
  };
}

export function assertReleaseCommit(head: string, taggedCommit: string, onMain: boolean): void {
  if (head !== taggedCommit) {
    throw new Error("The checked-out commit must match the release tag, not a same-named branch.");
  }
  if (!onMain) {
    throw new Error("The release tag must be reachable from origin/main.");
  }
}

function checkTaggedRelease(tag: string): void {
  const packages = [".", "packages/core", "playground", "docs"];
  const versions = Object.fromEntries(packages.map((directory) => {
    const manifest = JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8")) as { version: string };
    return [directory, manifest.version];
  }));
  const info = getReleaseInfo(tag, versions);
  const git = (args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();
  // 明确读取 Git 标签（refs/tags/...）指向的提交，避免把同名分支误当作版本标签。
  const taggedCommit = git(["rev-parse", "--verify", `refs/tags/${tag}^{commit}`]);
  const head = getCurrentHead();
  const ancestry = spawnSync("git", ["merge-base", "--is-ancestor", taggedCommit, "refs/remotes/origin/main"]);
  if (ancestry.error) {
    throw ancestry.error;
  }
  assertReleaseCommit(head, taggedCommit, ancestry.status === 0);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, [
      `version=${info.version}`,
      `artifact=${info.artifact}`,
      `npm_tag=${info.npmTag}`,
      `prerelease=${info.prerelease}`,
      ""
    ].join("\n"));
  }
  console.log(`Release tag verified: ${tag}; npm dist-tag: ${info.npmTag}.`);
}


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

function assertReleaseNotesCanBePrepared(): void {
  const source = readFileSync("CHANGELOG.md", "utf8");
  const { commits, latestTag } = readReleaseCommits();
  assertChangelogCanBePrepared(createChangelogPreparation(source, commits, latestTag));
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
  assertReleaseNotesCanBePrepared();
  const originalHead = getCurrentHead();

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

  const pnpm = getPnpmCommand(bumppArgs);
  const result = spawnSync(pnpm.command, pnpm.args, {
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

// 导入测试时不执行命令。--check-tag 只读校验标签；其他参数进入原有的版本提升、提交和打标签流程。
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv[2] === "--check-tag") {
      checkTaggedRelease(process.argv[3] ?? "");
    } else {
      main();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n${chalk.red.bold("Release failed:")} ${chalk.red(message)}`);
    process.exitCode = 1;
  }
}