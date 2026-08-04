// @env node

import { readFileSync } from "node:fs";
import process from "node:process";
import { readCommits } from "./changelog-git";
import type { ConventionalCommit } from "./changelog-utils";
import { assertValidCommitSubject } from "./changelog-utils";

interface CliOptions {
  allowMerge: boolean;
  messageFile?: string;
  range?: string;
}

function parseArguments(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    allowMerge: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--allow-merge") {
      options.allowMerge = true;
      continue;
    }
    if (argument === "--range") {
      options.range = args[index + 1];
      index += 1;
      if (!options.range) {
        throw new Error("`--range` requires a Git revision range.");
      }
      continue;
    }
    if (options.messageFile) {
      throw new Error(`Unexpected argument: ${argument}`);
    }
    options.messageFile = argument;
  }

  return options;
}

function readCommitSubjects(options: CliOptions): ConventionalCommit[] {
  if (options.range) {
    return readCommits(options.range);
  }

  const messageFile = options.messageFile;
  const message = messageFile
    ? readFileSync(messageFile, "utf8")
    : process.env.COMMIT_MESSAGE;

  if (!message) {
    throw new Error("Provide a commit message file or set the COMMIT_MESSAGE environment variable.");
  }

  return [{
    subject: message.replace(/\r\n/g, "\n").split("\n", 1)[0].trim()
  }];
}

try {
  const options = parseArguments();
  const invalidCommits: string[] = [];
  for (const commit of readCommitSubjects(options)) {
    try {
      assertValidCommitSubject(commit.subject, {
        allowMerge: options.allowMerge
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      invalidCommits.push(`${commit.hash ? `${commit.hash.slice(0, 8)} ` : ""}${message}`);
    }
  }

  if (invalidCommits.length) {
    throw new Error(`Commit message validation failed:\n- ${invalidCommits.join("\n- ")}`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}