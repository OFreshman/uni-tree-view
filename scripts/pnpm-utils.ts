// @env node

import process from "node:process";

interface PnpmRuntime {
  cliPath?: string;
  nodePath?: string;
  platform?: NodeJS.Platform;
}

/** pnpm run 会提供命令行工具的入口路径；用 Node 启动 JS 入口，避免直接执行 Windows 的 .cmd 批处理文件。 */
export function getPnpmCommand(args: string[], runtime: PnpmRuntime = {}) {
  const cliPath = runtime.cliPath ?? process.env.npm_execpath;
  const platform = runtime.platform ?? process.platform;

  if (cliPath) {
    if (/\.[cm]?js$/i.test(cliPath)) {
      return {
        command: runtime.nodePath ?? process.execPath,
        args: [cliPath, ...args]
      };
    }
    if (!/\.(?:cmd|bat)$/i.test(cliPath)) {
      return { command: cliPath, args: [...args] };
    }
  }

  if (platform === "win32") {
    throw new Error("Run this script through pnpm so its JavaScript entry is available in npm_execpath.");
  }
  return { command: "pnpm", args: [...args] };
}