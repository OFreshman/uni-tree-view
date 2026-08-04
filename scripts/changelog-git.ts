// @env node

import { execFileSync } from "node:child_process";
import type { ConventionalCommit } from "./changelog-utils";

export type GitCommandRunner = (args: string[]) => string;

export interface GitCommit extends ConventionalCommit {
  body: string;
  hash: string;
}

export interface ReleaseCommits {
  commits: GitCommit[];
  latestTag?: string;
}

const runGitCommand: GitCommandRunner = (args) => execFileSync("git", args, {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});

export function getCommitRange(latestTag?: string): string {
  return latestTag ? `${latestTag}..HEAD` : "HEAD";
}

export function parseGitLogOutput(output: string): GitCommit[] {
  return output
    .split("\x1E")
    .map((record) => record.replace(/^\n+|\n+$/g, ""))
    .filter(Boolean)
    .map((record) => {
      const [hash = "", subject = "", ...bodyParts] = record.split("\x1F");
      return {
        body: bodyParts.join("\x1F").trim(),
        hash: hash.trim(),
        subject: subject.trim()
      };
    });
}

export function findLatestVersionTag(runGit: GitCommandRunner = runGitCommand): string | undefined {
  const isShallowRepository = runGit(["rev-parse", "--is-shallow-repository"]).trim() === "true";
  if (isShallowRepository) {
    throw new Error(
      "Cannot determine the changelog commit range from a shallow Git clone. "
      + "Fetch full history and tags, or use `actions/checkout` with `fetch-depth: 0`."
    );
  }

  const versionTags = runGit(["tag", "--list", "v[0-9]*"]).trim();
  if (!versionTags) {
    return undefined;
  }

  try {
    return runGit(["describe", "--tags", "--abbrev=0", "--match", "v[0-9]*"]).trim() || undefined;
  } catch (error) {
    const details = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(`Failed to find the latest reachable version tag for changelog generation.${details}`);
  }
}

export function readCommits(
  range: string,
  runGit: GitCommandRunner = runGitCommand
): GitCommit[] {
  const output = runGit([
    "log",
    "--no-merges",
    "--format=%H%x1f%s%x1f%b%x1e",
    range
  ]);

  return parseGitLogOutput(output);
}

export function readReleaseCommits(runGit: GitCommandRunner = runGitCommand): ReleaseCommits {
  const latestTag = findLatestVersionTag(runGit);

  return {
    commits: readCommits(getCommitRange(latestTag), runGit),
    latestTag
  };
}