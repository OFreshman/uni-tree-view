// @env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { extractReleaseNotes } from "./changelog-utils";

const ChangelogFile = "CHANGELOG.md";

async function main(): Promise<void> {
  const [versionArgument, outputFile] = process.argv.slice(2);
  if (!versionArgument) {
    throw new Error("Usage: pnpm changelog:notes <version> [output-file]");
  }

  const version = versionArgument.replace(/^v/, "");
  const source = await readFile(resolve(ChangelogFile), "utf8");
  const notes = `${extractReleaseNotes(source, version)}\n`;

  if (outputFile) {
    await writeFile(resolve(outputFile), notes, "utf8");
    console.log(`Extracted ${ChangelogFile} notes for v${version} to ${outputFile}.`);
    return;
  }

  process.stdout.write(notes);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});