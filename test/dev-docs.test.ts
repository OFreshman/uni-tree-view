import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";
import { resolvePlaygroundPort } from "../scripts/dev-docs-utils";

describe("resolvePlaygroundPort", () => {
  it("keeps the dedicated default playground port", () => {
    expect(resolvePlaygroundPort([])).toBe(9861);
  });

  it.each([
    [["--port", "3000"], 3001],
    [["--port=3000"], 3001]
  ])("supports docs port arguments %#", (args, expected) => {
    expect(resolvePlaygroundPort(args)).toBe(expected);
  });

  it.each([
    ["missing", ["--port"]],
    ["non-numeric", ["--port", "abc"]],
    ["out of range", ["--port=65535"]]
  ])("rejects %s port values", (_description, args) => {
    expect(() => resolvePlaygroundPort(args)).toThrow();
  });
});

describe("dev docs process", () => {
  it.each(["npm_execpath", "NPM_EXECPATH", "Npm_ExecPath"])("preserves a child failure with inherited %s", (execPathKey) => {
    const fakeBinDir = mkdtempSync(path.join(tmpdir(), "uni-tree-view-dev-docs-"));
    const fakePnpmScript = path.join(fakeBinDir, "fake-pnpm.mjs");
    const callsFile = path.join(fakeBinDir, "calls.txt");

    const fakePnpmSource = `import { appendFileSync } from "node:fs";
const args = process.argv.slice(2);
appendFileSync(process.env.PNPM_CALLS_FILE, args.join(" ") + "\\n");
if (args.includes("playground")) {
  setTimeout(() => process.exit(1), 50);
} else {
  process.once("SIGTERM", () => process.exit(0));
  setInterval(() => {}, 1000);
}
`;
    writeFileSync(fakePnpmScript, fakePnpmSource);

    // Windows treats environment keys case-insensitively, but this object does not.
    // Seed each casing so the normalization is also covered on Linux and macOS.
    const env: NodeJS.ProcessEnv = { ...process.env, [execPathKey]: "must-be-replaced.cjs" };
    for (const key of Object.keys(env)) {
      if (key.toLowerCase() === "npm_execpath") {
        delete env[key];
      }
    }
    env.npm_execpath = fakePnpmScript;
    env.PNPM_CALLS_FILE = callsFile;

    try {
      expect(Object.keys(env).filter((key) => key.toLowerCase() === "npm_execpath")).toEqual(["npm_execpath"]);
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", path.resolve("scripts/dev-docs.ts")],
        {
          cwd: process.cwd(),
          env,
          encoding: "utf8",
          timeout: 5000
        }
      );

      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(1);
      const calls = readFileSync(callsFile, "utf8");
      expect(calls).toContain("-C playground exec uni");
      expect(calls).toContain("-C docs dev");
      expect(result.stderr).not.toContain("spawn");
    } finally {
      rmSync(fakeBinDir, { force: true, recursive: true });
    }
  });
});