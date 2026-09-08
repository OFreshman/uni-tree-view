import { describe, expect, it } from "vitest";
import { getPnpmCommand } from "../scripts/pnpm-utils";

describe("pnpm child commands", () => {
  it.each(["win32", "darwin", "linux"] as const)("uses the JavaScript CLI without shell quoting on %s", (platform) => {
    const args = ["-C", "a folder", "dev", "--port", "3000"];
    expect(getPnpmCommand(args, {
      cliPath: "C:/Program Files/pnpm/pnpm.cjs",
      nodePath: "C:/Program Files/node/node.exe",
      platform
    })).toEqual({
      command: "C:/Program Files/node/node.exe",
      args: ["C:/Program Files/pnpm/pnpm.cjs", ...args]
    });
    expect(args[0]).toBe("-C");
  });

  it("supports the standalone pnpm executable", () => {
    expect(getPnpmCommand(["build"], {
      cliPath: "C:/tools/pnpm.exe",
      platform: "win32"
    })).toEqual({ command: "C:/tools/pnpm.exe", args: ["build"] });
  });

  it("uses PATH for direct script invocation on POSIX", () => {
    expect(getPnpmCommand(["build"], { cliPath: "", platform: "linux" }))
      .toEqual({ command: "pnpm", args: ["build"] });
  });

  it.each(["", "C:/tools/pnpm.cmd"])("rejects an unavailable JS entry on Windows: %s", (cliPath) => {
    expect(() => getPnpmCommand(["build"], { cliPath, platform: "win32" }))
      .toThrow("Run this script through pnpm");
  });
});