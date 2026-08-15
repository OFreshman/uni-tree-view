import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
  it("preserves a child failure when the sibling exits immediately", () => {
    const fakeBinDir = mkdtempSync(path.join(tmpdir(), "uni-tree-view-dev-docs-"));
    const fakePnpmScript = path.join(fakeBinDir, "fake-pnpm.mjs");
    const fakePnpm = path.join(fakeBinDir, "pnpm");
    const fakePnpmCommand = path.join(fakeBinDir, "pnpm.cmd");

    const fakePnpmSource = `const args = process.argv.slice(2);
if (args.includes("playground")) {
  setTimeout(() => process.exit(1), 50);
} else {
  process.once("SIGTERM", () => process.exit(0));
  setInterval(() => {}, 1000);
}
`;
    writeFileSync(fakePnpmScript, fakePnpmSource);
    writeFileSync(fakePnpm, `#!/usr/bin/env node\n${fakePnpmSource}`);
    chmodSync(fakePnpm, 0o755);
    writeFileSync(fakePnpmCommand, `@echo off\r\n"${process.execPath}" "${fakePnpmScript}" %*\r\n`);

    try {
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", path.resolve("scripts/dev-docs.ts")],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            PATH: `${fakeBinDir}${path.delimiter}${process.env.PATH ?? ""}`
          },
          encoding: "utf8",
          timeout: 5000
        }
      );

      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(1);
    } finally {
      rmSync(fakeBinDir, { force: true, recursive: true });
    }
  });
});