import { resolve } from "node:path";
import process, { cwd } from "node:process";
import chalk from "chalk";
import { consola } from "consola";
import { copy, ensureDir, pathExists, remove } from "fs-extra";

function r(...paths: string[]) {
  return resolve(cwd(), ...paths);
}

async function composeDocs() {
  const playgroundDist = r("playground", "dist", "build", "h5");
  const docsUiDist = r("docs", ".vitepress", "dist", "ui");

  if (!await pathExists(playgroundDist)) {
    throw new Error(`Playground H5 build not found: ${playgroundDist}`);
  }

  await remove(docsUiDist);
  await ensureDir(docsUiDist);
  await copy(playgroundDist, docsUiDist);

  consola.success(`Docs demo copied to ${chalk.cyan(docsUiDist)}`);
}

composeDocs().catch((error: unknown) => {
  consola.error(error);
  process.exitCode = 1;
});