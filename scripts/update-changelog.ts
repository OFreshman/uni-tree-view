// @env node

import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { formatReleaseDate, promoteUnreleased } from "./changelog-utils";

interface PackageJson {
  version: string;
}

const PackageFiles = [
  "package.json",
  "packages/core/package.json",
  "playground/package.json",
  "docs/package.json"
];

const ChangelogFiles = [
  "CHANGELOG.md",
  "packages/core/CHANGELOG.md"
];

async function readPackageVersion(filePath: string): Promise<string> {
  const source = await readFile(resolve(filePath), "utf8");
  return (JSON.parse(source) as PackageJson).version;
}

async function createChangelogUpdate(filePath: string, version: string, date: string) {
  const absolutePath = resolve(filePath);
  const source = await readFile(absolutePath, "utf8");
  const updatedSource = promoteUnreleased(source, { date, version });

  return {
    absolutePath,
    filePath,
    updatedSource
  };
}

function assertVersionIsNotTagged(version: string): void {
  const matchingTag = execFileSync("git", ["tag", "--list", `v${version}`], {
    encoding: "utf8"
  }).trim();

  if (matchingTag) {
    throw new Error(`Version ${version} is already tagged; run changelog updates through \`pnpm release\``);
  }
}

async function main(): Promise<void> {
  const versions = await Promise.all(PackageFiles.map(readPackageVersion));
  const uniqueVersions = new Set(versions);

  if (uniqueVersions.size !== 1) {
    const details = PackageFiles.map((filePath, index) => `${filePath}: ${versions[index]}`).join("\n");
    throw new Error(`Workspace package versions are not synchronized:\n${details}`);
  }

  const [version] = versions;
  assertVersionIsNotTagged(version);
  const date = process.env.RELEASE_DATE || formatReleaseDate();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid RELEASE_DATE: ${date}`);
  }

  // 先校验所有 CHANGELOG，再统一写入，避免其中一个文件校验失败时只更新了一半。
  const updates = await Promise.all(
    ChangelogFiles.map((filePath) => createChangelogUpdate(filePath, version, date))
  );

  await Promise.all(updates.map(async ({ absolutePath, filePath, updatedSource }) => {
    await writeFile(absolutePath, updatedSource, "utf8");
    console.log(`Updated ${filePath} for v${version}`);
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});