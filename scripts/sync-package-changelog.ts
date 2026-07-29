// @env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createPackageChangelog } from "./changelog-utils";

const ProjectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SourceFile = resolve(ProjectRoot, "CHANGELOG.md");
const PackageFile = resolve(ProjectRoot, "packages/core/CHANGELOG.md");

async function main(): Promise<void> {
  const source = await readFile(SourceFile, "utf8");
  await writeFile(PackageFile, createPackageChangelog(source), "utf8");
  console.log("Generated packages/core/CHANGELOG.md from CHANGELOG.md");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});