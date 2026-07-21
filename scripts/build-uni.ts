import { createWriteStream } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import process, { cwd } from "node:process";
import archiver from "archiver";
import chalk from "chalk";
import { consola } from "consola";
import {
  copy,
  emptyDir,
  ensureDir,
  outputFile,
  pathExists,
  readFile,
  readJson,
  remove
} from "fs-extra";

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
}

interface PlaygroundPackageJson extends PackageJson {
  private?: boolean;
  main?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const NpmPackageName = "uni-tree-view";
const PluginId = "KieranYin9527-tree";
const PluginDisplayName = "keryin-tree-view";

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

function validatePluginId() {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(PluginId) || PluginId.length > 20) {
    throw new Error(`Invalid DCloud plugin ID: ${PluginId}`);
  }
}

async function copyFirstExistingFile(paths: string[], dest: string) {
  for (const filePath of paths) {
    if (await pathExists(filePath)) {
      await copy(filePath, dest);
      return true;
    }
  }

  return false;
}

async function zipDirectory(sourceDir: string, zipPath: string) {
  await ensureDir(dirname(zipPath));
  await remove(zipPath);

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: {
        level: 9
      }
    });

    output.on("close", resolvePromise);
    output.on("error", rejectPromise);
    archive.on("warning", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        consola.warn(error.message);
        return;
      }

      rejectPromise(error);
    });
    archive.on("error", rejectPromise);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    void archive.finalize();
  });
}

function createDCloudPackage(pkg: PackageJson) {
  return {
    id: PluginId,
    displayName: PluginDisplayName,
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    license: pkg.license,
    homepage: pkg.homepage,
    repository: normalizeRepository(pkg.repository),
    bugs: normalizeBugs(pkg.bugs),
    keywords: pkg.keywords,
    engines: {
      HBuilderX: "^4.15.0",
      "uni-app": "^4.15.0"
    },
    dcloudext: {
      type: "component-vue",
      sale: {
        regular: {
          price: "0.00"
        }
      },
      declaration: {
        ads: "无",
        data: "插件不采集任何数据",
        permissions: "无"
      },
      npmurl: `https://www.npmjs.com/package/${NpmPackageName}`,
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
              vue: "-",
              nvue: "x",
              android: "-",
              ios: "-",
              harmony: "-"
            },
            mp: {
              weixin: "√",
              alipay: "√",
              toutiao: "-",
              baidu: "-",
              kuaishou: "-",
              jd: "-",
              harmony: "-",
              qq: "-",
              lark: "-"
            },
            quickapp: {
              huawei: "x",
              union: "x"
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
}

async function buildPluginPackage(pkg: PackageJson, pluginDir: string) {
  const coreDir = r("packages", "core");
  const sourceDir = r(coreDir, "src");
  const declarationFile = r(coreDir, "dist", "index.d.ts");

  await emptyDir(pluginDir);
  await copy(sourceDir, pluginDir);
  await copy(declarationFile, r(pluginDir, "index.d.ts"));
  await outputFile(
    r(pluginDir, "package.json"),
    `${JSON.stringify(createDCloudPackage(pkg), null, 2)}\n`
  );

  const copiedReadme = await copyFirstExistingFile([
    r(coreDir, "README.md"),
    r("README.md")
  ], r(pluginDir, "readme.md"));
  const copiedChangelog = await copyFirstExistingFile([
    r(coreDir, "CHANGELOG.md"),
    r("CHANGELOG.md")
  ], r(pluginDir, "changelog.md"));
  const copiedLicense = await copyFirstExistingFile([
    r(coreDir, "LICENSE"),
    r("LICENSE"),
    r("LICENSE.md"),
    r("license.md")
  ], r(pluginDir, "license.md"));

  if (!copiedReadme || !copiedChangelog || !copiedLicense) {
    throw new Error("DCloud package requires readme.md, changelog.md and license.md");
  }
}

function shouldCopyPlayground(sourcePath: string, playgroundDir: string) {
  const relativePath = relative(playgroundDir, sourcePath).split(sep).join("/");

  if (!relativePath) {
    return true;
  }

  return ![
    "node_modules",
    "dist",
    "dist-ssr",
    ".git",
    ".hbuilderx",
    "src/uni_modules",
    "types/auto-imports.d.ts",
    "types/components.d.ts",
    "types/uni-pages.d.ts"
  ].some((excludedPath) => (
    relativePath === excludedPath || relativePath.startsWith(`${excludedPath}/`)
  ));
}

async function materializeCatalogDependencies(
  dependencies: Record<string, string> | undefined,
  playgroundDir: string
) {
  const result: Record<string, string> = {};

  for (const [dependencyName, dependencyVersion] of Object.entries(dependencies ?? {})) {
    if (dependencyName === NpmPackageName) {
      continue;
    }

    if (dependencyVersion.startsWith("workspace:")) {
      throw new Error(`Standalone example cannot contain ${dependencyName}@${dependencyVersion}`);
    }

    if (!dependencyVersion.startsWith("catalog:")) {
      result[dependencyName] = dependencyVersion;
      continue;
    }

    const installedPackagePath = resolve(
      playgroundDir,
      "node_modules",
      dependencyName,
      "package.json"
    );
    const installedPackage = await readJson(installedPackagePath) as PackageJson;
    result[dependencyName] = installedPackage.version;
  }

  return result;
}

async function removeWorkspaceImports(exampleDir: string) {
  const pagePaths = [
    r(exampleDir, "src", "pages", "index", "index.vue"),
    r(exampleDir, "src", "pages", "examples", "index.vue")
  ];

  for (const pagePath of pagePaths) {
    const source = await readFile(pagePath, "utf8");
    const standaloneSource = source.replace(
      /^import UniTreeView from ["']uni-tree-view["'];\r?\n/m,
      ""
    );
    await outputFile(pagePath, standaloneSource);
  }
}

async function buildExampleProject(
  pkg: PackageJson,
  pluginDir: string,
  exampleDir: string
) {
  const playgroundDir = r("playground");
  await emptyDir(exampleDir);
  await copy(playgroundDir, exampleDir, {
    filter: (sourcePath) => shouldCopyPlayground(sourcePath, playgroundDir)
  });
  await copy(pluginDir, r(exampleDir, "src", "uni_modules", PluginId));

  const examplePackagePath = r(exampleDir, "package.json");
  const examplePackage = await readJson(examplePackagePath) as PlaygroundPackageJson;
  examplePackage.name = "kieranyin9527-tree-example";
  examplePackage.private = true;
  examplePackage.version = pkg.version;
  examplePackage.description = `${PluginDisplayName} DCloud 插件使用示例`;
  examplePackage.dependencies = await materializeCatalogDependencies(
    examplePackage.dependencies,
    playgroundDir
  );
  examplePackage.devDependencies = await materializeCatalogDependencies(
    examplePackage.devDependencies,
    playgroundDir
  );
  delete examplePackage.main;
  await outputFile(examplePackagePath, `${JSON.stringify(examplePackage, null, 2)}\n`);

  await removeWorkspaceImports(exampleDir);
  await outputFile(r(exampleDir, "README.md"), `# ${PluginDisplayName} 示例工程

本工程内置 DCloud 插件 \`${PluginId}\`，无需安装 npm 版组件。

\`\`\`bash
pnpm install
pnpm dev:h5
\`\`\`

组件示例位于 \`src/pages/index/index.vue\` 和 \`src/pages/examples/index.vue\`。
`);
}

async function build() {
  validatePluginId();

  const corePackagePath = r("packages", "core", "package.json");
  const pkg = await readJson(corePackagePath) as PackageJson;
  if (pkg.name !== NpmPackageName) {
    throw new Error(
      `The npm package name must remain ${NpmPackageName}; DCloud uses the separate ID ${PluginId}`
    );
  }

  const outputDir = r("artifacts", "dcloud");
  const stagingDir = r(outputDir, ".staging");
  const pluginDir = r(stagingDir, PluginId);
  const exampleDir = r(stagingDir, `${PluginId}-example`);
  const pluginZipPath = r(outputDir, `${PluginId}.zip`);
  const usageDocPath = r(outputDir, `${PluginId}-readme.md`);
  const exampleZipPath = r(outputDir, `${PluginId}-example.zip`);

  consola.info(chalk.cyan("Building DCloud release artifacts"));
  await emptyDir(outputDir);

  await buildPluginPackage(pkg, pluginDir);
  await zipDirectory(pluginDir, pluginZipPath);
  await copy(r(pluginDir, "readme.md"), usageDocPath);

  await buildExampleProject(pkg, pluginDir, exampleDir);
  await zipDirectory(exampleDir, exampleZipPath);
  await remove(stagingDir);

  consola.success(chalk.green(`Plugin package: ${pluginZipPath}`));
  consola.success(chalk.green(`Usage document: ${usageDocPath}`));
  consola.success(chalk.green(`Example project: ${exampleZipPath}`));
}

build().catch((error) => {
  consola.error("Failed to build DCloud release artifacts", error);
  process.exitCode = 1;
});