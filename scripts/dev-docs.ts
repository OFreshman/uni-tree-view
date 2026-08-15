// @env node

import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import process from "node:process";
import { resolvePlaygroundPort } from "./dev-docs-utils";

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const forwardedArgs = process.argv.slice(2).filter((argument) => argument !== "--");
const docsArgs = ["-C", "docs", "dev", ...forwardedArgs];
const children: ChildProcess[] = [];
let isShuttingDown = false;

function stop(child: ChildProcess): void {
  if (!child.killed) {
    child.kill("SIGTERM");
  }
}

function shutdown(exitCode: number): void {
  if (isShuttingDown) {
    return;
  }

  process.exitCode = exitCode;
  isShuttingDown = true;
  for (const child of children) {
    stop(child);
  }

  const forceExitTimer = setTimeout(() => {
    process.exit(exitCode);
  }, 1500);
  forceExitTimer.unref();
}

function start(args: string[], env: NodeJS.ProcessEnv): ChildProcess {
  const child = spawn(pnpmCommand, args, {
    env,
    stdio: "inherit"
  });
  children.push(child);

  child.once("error", (error) => {
    console.error(error);
    shutdown(1);
  });
  child.once("exit", (code, signal) => {
    if (!isShuttingDown) {
      const exitCode = code ?? (signal ? 1 : 0);
      shutdown(exitCode);
    }
  });

  return child;
}

process.once("SIGINT", () => shutdown(0));
process.once("SIGTERM", () => shutdown(0));

const playgroundPort = String(resolvePlaygroundPort(forwardedArgs));
const demoUrl = process.env.VITE_DEMO_URL ?? `http://localhost:${playgroundPort}/ui/`;

start(["-C", "playground", "exec", "uni", "--port", playgroundPort, "--strictPort"], process.env);
start(docsArgs, {
  ...process.env,
  VITE_DEMO_URL: demoUrl
});