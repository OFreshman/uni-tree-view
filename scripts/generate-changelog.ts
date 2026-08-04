// @env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { readReleaseCommits } from "./changelog-git";
import {
  createChangelogPreparation,
  replaceUnreleasedContent,
  resolveChangelogGeneration
} from "./changelog-utils";

const ChangelogFile = "CHANGELOG.md";

async function main(): Promise<void> {
  const checkOnly = process.argv.includes("--check");
  const force = process.argv.includes("--force");
  const absolutePath = resolve(ChangelogFile);
  const source = await readFile(absolutePath, "utf8");
  const { commits, latestTag } = readReleaseCommits();
  const preparation = createChangelogPreparation(source, commits, latestTag);
  const decision = resolveChangelogGeneration(preparation, force);

  if (decision.action === "keep") {
    console.log("Keeping existing Unreleased notes; automatic generation was skipped.");
    if (decision.skippedContent) {
      console.log(
        `Review the skipped automatic notes ${preparation.commitRangeDescription}:\n\n${decision.skippedContent}`
      );
    }
    return;
  }

  if (checkOnly) {
    const action = force ? "regenerated" : "generated";
    console.log(
      `CHANGELOG.md can be ${action} from Conventional Commits ${preparation.commitRangeDescription}.`
    );
    return;
  }

  const updatedSource = replaceUnreleasedContent(source, decision.content);
  await writeFile(absolutePath, updatedSource, "utf8");
  const action = force ? "Regenerated" : "Generated";
  console.log(
    `${action} ${ChangelogFile} Unreleased notes from Conventional Commits ${preparation.commitRangeDescription}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});