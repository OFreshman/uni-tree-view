import { describe, expect, it } from "vitest";
import {
  findLatestVersionTag,
  getCommitRange,
  parseGitLogOutput,
  readCommits
} from "../scripts/changelog-git";

function createGitRunner(responses: Record<string, Error | string>) {
  return (args: string[]): string => {
    const command = args.join(" ");
    const response = responses[command];
    if (response instanceof Error) {
      throw response;
    }
    if (response === undefined) {
      throw new Error(`Unexpected git command: ${command}`);
    }
    return response;
  };
}

describe("getCommitRange", () => {
  it("uses commits since the latest version tag", () => {
    expect(getCommitRange("v0.3.1")).toBe("v0.3.1..HEAD");
  });

  it("falls back to the entire history when the repository has no tag", () => {
    expect(getCommitRange()).toBe("HEAD");
  });
});

describe("parseGitLogOutput", () => {
  it("parses commit hashes, subjects, and multiline bodies", () => {
    const output = [
      "abc123\x1Ffeat(core): 新增能力\x1FDetails.\n\nBREAKING CHANGE: new API\x1E",
      "\ndef456\x1Ffix: 修复问题\x1F\x1E\n"
    ].join("");

    expect(parseGitLogOutput(output)).toEqual([
      {
        body: "Details.\n\nBREAKING CHANGE: new API",
        hash: "abc123",
        subject: "feat(core): 新增能力"
      },
      {
        body: "",
        hash: "def456",
        subject: "fix: 修复问题"
      }
    ]);
  });

  it("reads a requested revision range without merge commits", () => {
    const runGit = createGitRunner({
      "log --no-merges --format=%H%x1f%s%x1f%b%x1e base..head": "abc123\x1Ffix: 修复问题\x1F\x1E"
    });

    expect(readCommits("base..head", runGit)).toEqual([{
      body: "",
      hash: "abc123",
      subject: "fix: 修复问题"
    }]);
  });
});

describe("findLatestVersionTag", () => {
  it("rejects shallow clones instead of silently reading incomplete history", () => {
    const runGit = createGitRunner({
      "rev-parse --is-shallow-repository": "true\n"
    });

    expect(() => findLatestVersionTag(runGit)).toThrow("shallow Git clone");
  });

  it("returns undefined only when the full repository has no version tags", () => {
    const runGit = createGitRunner({
      "rev-parse --is-shallow-repository": "false\n",
      "tag --list v[0-9]*": ""
    });

    expect(findLatestVersionTag(runGit)).toBeUndefined();
  });

  it("returns the latest reachable version tag", () => {
    const runGit = createGitRunner({
      "describe --tags --abbrev=0 --match v[0-9]*": "v0.3.1\n",
      "rev-parse --is-shallow-repository": "false\n",
      "tag --list v[0-9]*": "v0.3.0\nv0.3.1\n"
    });

    expect(findLatestVersionTag(runGit)).toBe("v0.3.1");
  });

  it("reports unreachable version tags instead of treating them as absent", () => {
    const runGit = createGitRunner({
      "describe --tags --abbrev=0 --match v[0-9]*": new Error("no reachable tag"),
      "rev-parse --is-shallow-repository": "false\n",
      "tag --list v[0-9]*": "v0.3.1\n"
    });

    expect(() => findLatestVersionTag(runGit)).toThrow("latest reachable version tag");
  });
});