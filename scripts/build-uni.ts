import { resolve } from "node:path";
import process, { cwd } from "node:process";
import chalk from "chalk";
import { consola } from "consola";
import { copy, emptyDir, outputFile, pathExists, readJson } from "fs-extra";

interface PackageJson {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string | {
    type?: string;
    url?: string;
  };
  bugs?: string | {
    url?: string;
  };
  keywords?: string[];
  type?: string;
}

function r(...paths: string[]) {
  return resolve(cwd(), ".", ...paths);
}

function normalizeRepository(repository: PackageJson["repository"]) {
  if (typeof repository === "string") {
    return repository;
  }

  return repository?.url?.replace(/^git\+/, "").replace(/\.git$/, "");
}

function normalizeBugs(bugs: PackageJson["bugs"]) {
  if (typeof bugs === "string") {
    return bugs;
  }

  return bugs?.url;
}

async function copyFirstExistingFile(paths: string[], dest: string) {
  for (const filePath of paths) {
    if (await pathExists(filePath)) {
      consola.info(`Copying file: \`${filePath}\``);
      await copy(filePath, dest);
      return true;
    }
  }

  return false;
}

async function build() {
  const fromDir = r("packages", "core");
  const pkg = await readJson(r(fromDir, "package.json")) as PackageJson;
  const uniPkgId = "uni-tree-view";
  const destDir = r("playground", "src", "uni_modules", uniPkgId);

  const uniPkg = {
    id: uniPkgId,
    name: pkg.name,
    displayName: "Uni Tree View",
    type: pkg.type,
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    license: pkg.license,
    homepage: pkg.homepage,
    repository: normalizeRepository(pkg.repository),
    bugs: normalizeBugs(pkg.bugs),
    keywords: pkg.keywords,
    dcloudext: {
      type: "component-vue",
      sale: {
        regular: {
          price: "0.00"
        },
        sourcecode: {
          price: "0.00"
        }
      },
      contact: {
        qq: ""
      },
      declaration: {
        ads: "无",
        data: "无",
        permissions: "无"
      },
      npmurl: `https://www.npmjs.com/package/${pkg.name}`,
      darkmode: "x",
      i18n: "x",
      widescreen: "√"
    },
    uni_modules: {
      dependencies: [],
      encrypt: [],
      platforms: {
        client: {
          "uni-app": {
            vue: {
              vue2: "x",
              vue3: "√"
            },
            web: {
              safari: "√",
              chrome: "√"
            },
            app: {
              vue: "u",
              nvue: "x",
              android: "u",
              ios: "u",
              harmony: "u"
            },
            mp: {
              weixin: "√",
              alipay: "√",
              toutiao: "u",
              baidu: "u",
              kuaishou: "u",
              jd: "u",
              harmony: "u",
              qq: "u",
              lark: "u"
            },
            quickapp: {
              huawei: "u",
              union: "u"
            }
          },
          "uni-app-x": {
            web: {
              safari: "x",
              chrome: "x"
            },
            app: {
              android: "x",
              ios: "x",
              harmony: "x"
            },
            mp: {
              weixin: "x"
            }
          }
        },
        cloud: {
          aliyun: "x",
          tcb: "x",
          alipay: "x"
        }
      }
    }
  };

  consola.info(chalk.cyan("Building uni_modules"));

  consola.info(`Cleaning dest directory: \`${destDir}\``);
  await emptyDir(destDir);

  const srcDir = r(fromDir, "src");
  consola.info(`Copying main directory: \`${srcDir}\``);
  await copy(srcDir, destDir);

  const dtsDir = r(fromDir, "dist", "index.d.ts");
  consola.info(`Copying dts: \`${dtsDir}\``);
  await copy(dtsDir, r(destDir, "index.d.ts"));

  consola.info(`Writing package.json: \`${uniPkg.id}\``);
  await outputFile(r(destDir, "package.json"), `${JSON.stringify(uniPkg, null, 2)}\n`);

  const copiedReadme = await copyFirstExistingFile([
    r(fromDir, "README.md"),
    r("README.md")
  ], r(destDir, "readme.md"));

  if (!copiedReadme) {
    consola.warn("README.md was not found, skip copying readme.md");
  }

  const copiedChangelog = await copyFirstExistingFile([
    r(fromDir, "CHANGELOG.md"),
    r("CHANGELOG.md")
  ], r(destDir, "changelog.md"));

  if (!copiedChangelog) {
    consola.warn("CHANGELOG.md was not found, skip copying changelog.md");
  }

  const copiedLicense = await copyFirstExistingFile([
    r(fromDir, "LICENSE"),
    r("LICENSE"),
    r("LICENSE.md"),
    r("license.md")
  ], r(destDir, "license.md"));

  if (!copiedLicense) {
    consola.warn("LICENSE was not found, skip copying license.md");
  }

  consola.success(chalk.green("Build succeeded for uni_modules"));
}

build().catch((error) => {
  consola.error("Build failed for `uni_modules`", error);
  process.exitCode = 1;
});