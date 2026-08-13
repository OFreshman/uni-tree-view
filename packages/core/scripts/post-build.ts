import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process, { cwd } from "node:process";
import chalk from "chalk";
import { consola } from "consola";
import { copy, remove } from "fs-extra";

export function r(...paths: string[]) {
  return resolve(cwd(), ".", ...paths);
}

async function main() {
  try {
    consola.info(chalk.cyan("Simplifying dist"));

    await Promise.all([
      remove(r("dist", "index.mjs")),
      remove(r("dist", "index.d.mts"))
    ]);

    await copy(r("dist-resolver", "resolver"), r("dist-resolver"));
    await remove(r("dist-resolver", "resolver"));

    consola.success(chalk.green("Simplify succeeded for dist"));
  } catch (error) {
    consola.error("Simplify failed for `dist`", error);
    process.exitCode = 1;
  }

  try {
    consola.info(chalk.cyan("Copying README"));

    const readme = await readFile(r("..", "..", "README.md"), "utf8");
    const packageReadme = readme
      .replace(
        "src=\"./assets/uni-tree-view-logo.svg\"",
        "src=\"https://raw.githubusercontent.com/OFreshman/uni-tree-view/main/assets/uni-tree-view-logo.svg\""
      )
      .replace(
        "[CONTRIBUTING.md](./CONTRIBUTING.md)",
        "[CONTRIBUTING.md](https://github.com/OFreshman/uni-tree-view/blob/main/CONTRIBUTING.md)"
      )
      .replace(
        "[许可证与署名说明](./docs/guide/license.md)",
        "[许可证与署名说明](https://ofreshman.github.io/uni-tree-view/guide/license)"
      );

    await writeFile(r("README.md"), packageReadme);

    consola.success(chalk.green("Copy succeeded for README"));
  } catch (error) {
    consola.error("Copy failed for `README`", error);
    process.exitCode = 1;
  }
}

main();