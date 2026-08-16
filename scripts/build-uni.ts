import { extname, relative, resolve, sep } from "node:path";
import process, { cwd } from "node:process";
import chalk from "chalk";
import { consola } from "consola";
import {
  copy,
  emptyDir,
  ensureDir,
  outputFile,
  pathExists,
  readdir,
  readFile,
  readJson
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
const PluginDisplayName = "Uni Tree View";
// DCloud 规定 keywords 最多 5 个，不能沿用 npm 包里那份长列表；
// 插件市场检索以中文为主，因此保留一个中文词。
const PluginKeywords = ["树形组件", "tree", "tree-view", "uni-app", "vue3"];
// easycom 约定：组件必须位于 components/<组件名>/<组件名>.vue，这个名字同时就是模板里的标签名。
// npm 渠道通过 packages/core/package.json 的 exports 指定显式路径，不依赖这个命名；uni_modules
// 渠道完全依赖它。重命名组件文件时 npm 侧会被迫同步 exports，市场侧却会静默失去自动注册，
// 所以在产物上钉死。
const EasycomComponents = ["uni-tree-view"];
// 插件目录是源码裸拷贝，自身没有依赖安装过程：裸包名在恰好装了该依赖的 CLI 工程里能解析，
// 在 HBuilderX 可视化工程里解析不了，属于「一部分用户能用」的故障。vue 是唯一安全例外。
const AllowedBareImports = new Set(["vue"]);
// 示例工程不装 npm 版组件：运行时导入整条删掉、改由 easycom 从 uni_modules 自动注册；
// 纯类型导入删不掉（引用了导出的类型），改指向工程内的插件目录。这个路径依赖 CLI 工程
// 的 `@` 别名（vite.config.ts 的 resolve.alias 与 tsconfig 的 paths 都已配置）。
const PluginTypeImportPath = `@/uni_modules/${PluginId}`;
const ScannedExtensions = new Set([".vue", ".ts", ".js", ".scss"]);
// 提取模块说明符：ESM 的 from / 副作用 import，以及 scss 的 @use / @import。
const SpecifierPatterns = [
  /\bfrom\s+["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g,
  /@(?:use|import)\s+["']([^"']+)["']/g
];
// 整条 import 语句，含多行具名列表。中间子句禁止出现 `;` 和引号，否则惰性匹配会跨过
// 前一条已闭合的 import（例如把 `import { computed } from "vue";` 一起吞掉）。
// 子句连同两侧空白一起捕获后再 trim，避免相邻量词互吃字符导致的回溯放大。
const PackageImportPattern = new RegExp(
  String.raw`^[^\S\n]*import\b([^;"']+?)\bfrom\s*["']${NpmPackageName}["'];?[^\S\n]*\n?`,
  "gm"
);

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

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = resolve(dir, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  }));

  return nested.flat();
}

async function assertEasycomLayout(pluginDir: string) {
  const componentsDir = resolve(pluginDir, "components");
  if (!await pathExists(componentsDir)) {
    throw new Error("The plugin is missing the easycom `components` directory");
  }

  const entries = await readdir(componentsDir, { withFileTypes: true });
  const componentNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const componentName of componentNames) {
    if (!await pathExists(resolve(componentsDir, componentName, `${componentName}.vue`))) {
      throw new Error(`easycom requires components/${componentName}/${componentName}.vue`);
    }
  }

  for (const componentName of EasycomComponents) {
    if (!componentNames.includes(componentName)) {
      throw new Error(`The plugin no longer exposes the <${componentName}> component`);
    }
  }
}

async function collectModuleSpecifiers(filePath: string) {
  const source = await readFile(filePath, "utf8");
  const specifiers: string[] = [];

  for (const pattern of SpecifierPatterns) {
    for (const [, specifier] of source.matchAll(pattern)) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
}

async function assertPortableImports(pluginDir: string) {
  const violations: string[] = [];

  for (const filePath of await collectFiles(pluginDir)) {
    if (!ScannedExtensions.has(extname(filePath))) {
      continue;
    }

    for (const specifier of await collectModuleSpecifiers(filePath)) {
      if (specifier.startsWith(".") || specifier.startsWith("/")) {
        continue;
      }

      if (AllowedBareImports.has(specifier)) {
        continue;
      }

      violations.push(`${relative(pluginDir, filePath)} -> ${specifier}`);
    }
  }

  if (violations.length) {
    const allowed = [...AllowedBareImports].join(", ");
    const details = violations.map((violation) => `  ${violation}`).join("\n");
    throw new Error(`The plugin must not use bare imports outside [${allowed}]:\n${details}`);
  }
}

// 示例工程不安装 npm 版组件，任何残留引用都会让它在仓库外无法构建（仓库内被 workspace
// 链接掩盖）。这条断言就是 P1 那次漏改的兜底：新增示例文件时忘了处理会直接报错。
async function assertStandaloneExample(exampleDir: string, pluginDir: string) {
  const violations: string[] = [];

  for (const filePath of await collectFiles(r(exampleDir, "src"))) {
    if (filePath === pluginDir || filePath.startsWith(`${pluginDir}${sep}`)) {
      continue;
    }

    if (!ScannedExtensions.has(extname(filePath))) {
      continue;
    }

    for (const specifier of await collectModuleSpecifiers(filePath)) {
      if (specifier === NpmPackageName || specifier.startsWith(`${NpmPackageName}/`)) {
        violations.push(`${relative(exampleDir, filePath)} -> ${specifier}`);
      }
    }
  }

  const examplePackage = await readJson(
    r(exampleDir, "package.json")
  ) as PlaygroundPackageJson;
  const declaredDependencies = {
    ...examplePackage.dependencies,
    ...examplePackage.devDependencies
  };
  if (NpmPackageName in declaredDependencies) {
    violations.push(`package.json -> ${NpmPackageName}`);
  }

  if (violations.length) {
    const details = violations.map((violation) => `  ${violation}`).join("\n");
    throw new Error(
      `The standalone example must not reference ${NpmPackageName}; the component can only come from uni_modules:\n${details}`
    );
  }
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
    keywords: PluginKeywords,
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
      contact: {
        qq: ""
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

// 插件 readme 直接拷自 packages/core/README.md，那份是以 npm 通道为主线写的。市场用户
// 装完插件第一眼该看到的是 easycom 用法，所以在前面补一段插件专属说明。
function createPluginReadmeGuide() {
  return `# ${PluginDisplayName}（\`uni_modules\` 插件）

插件已按 \`uni_modules\` 规范导入，组件目录符合 easycom 约定，模板里直接写 \`<uni-tree-view>\` 即可，**不需要** import：

\`\`\`vue
<template>
  <uni-tree-view :data="treeData" />
</template>
\`\`\`

需要 TypeScript 类型时从插件目录导入：

\`\`\`ts
// CLI 工程（插件在 src/uni_modules 下，\`@\` 指向 src）
import type { TreeDataItem, UniTreeViewExposed } from "${PluginTypeImportPath}";
\`\`\`

HBuilderX 可视化工程没有 \`@\` 别名、插件也在工程根目录，改用相对路径指向 \`uni_modules/${PluginId}\`。

下面是与 npm 包共用的完整说明，其中「npm 方式」一节只适用于 npm 通道。

---

`;
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

  const readmePath = r(pluginDir, "readme.md");
  const copiedReadme = await copyFirstExistingFile([
    r(coreDir, "README.md"),
    r("README.md")
  ], readmePath);
  const copiedChangelog = await copyFirstExistingFile([
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

  await outputFile(readmePath, `${createPluginReadmeGuide()}${await readFile(readmePath, "utf8")}`);
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

function rewritePackageImports(source: string, displayPath: string) {
  return source.replace(PackageImportPattern, (statement, bindings: string) => {
    const clause = bindings.trim();

    // 纯类型导入：类型在运行时被擦除，但语义不能丢，改指向工程内的插件目录。
    if (/^type\b/.test(clause)) {
      return statement.replace(
        new RegExp(String.raw`["']${NpmPackageName}["']`),
        `"${PluginTypeImportPath}"`
      );
    }

    // 运行时默认导入：整条删掉，交给 easycom 从 uni_modules 自动注册。
    if (clause === "UniTreeView") {
      return "";
    }

    // 其余形态（默认导入混具名、内联 type 说明符等）无法机械改写，直接失败而不是静默放过。
    throw new Error(
      `${displayPath} imports ${NpmPackageName} in a form the standalone example cannot rewrite: import ${clause} from ...`
    );
  });
}

// 只处理两个页面文件曾让 6 个 docs-demos 组件和 utils 里的类型导入漏网：仓库内有 workspace
// 链接看不出问题，产物拿到仓库外就构建失败。这里改成扫描整个 src。
async function makeExampleStandalone(exampleDir: string) {
  for (const filePath of await collectFiles(r(exampleDir, "src"))) {
    if (!ScannedExtensions.has(extname(filePath))) {
      continue;
    }

    const source = await readFile(filePath, "utf8");
    const standaloneSource = rewritePackageImports(source, relative(exampleDir, filePath));
    if (standaloneSource !== source) {
      await outputFile(filePath, standaloneSource);
    }
  }
}

async function buildExampleProject(pkg: PackageJson, exampleDir: string) {
  const playgroundDir = r("playground");
  await emptyDir(exampleDir);
  await copy(playgroundDir, exampleDir, {
    filter: (sourcePath) => shouldCopyPlayground(sourcePath, playgroundDir)
  });

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

  await makeExampleStandalone(exampleDir);
  await outputFile(r(exampleDir, "README.md"), `# ${PluginDisplayName} 示例工程

本工程内置 DCloud 插件 \`${PluginId}\`，无需安装 npm 版组件。

\`\`\`bash
pnpm install
pnpm dev:h5
\`\`\`

组件示例位于 \`src/pages/index/index.vue\` 和 \`src/pages/examples/index.vue\`。

工程里没有 npm 版 \`${NpmPackageName}\` 依赖：模板里的 \`<uni-tree-view>\` 由 easycom 从
\`src/uni_modules/${PluginId}\` 解析，类型从 \`${PluginTypeImportPath}\` 导入。所以在这里跑通
\`pnpm install && pnpm build:h5\`，等于验证了即将发布的插件形态本身。
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

  // 唯一产物是 HBuilderX 发布用工程。uni_modules 插件只能由 IDE 打包上传，旧的插件 ZIP、
  // 示例工程 ZIP 和单独 readme 都是网页上传通道的遗留，条目页与 GitHub release 都不再需要。
  const workspaceDir = r("artifacts", "hbuilderx");
  const exampleDir = r(workspaceDir, `${PluginId}-example`);
  const pluginDir = r(exampleDir, "src", "uni_modules", PluginId);

  consola.info(chalk.cyan("Building the DCloud publish workspace"));
  await ensureDir(workspaceDir);

  await buildExampleProject(pkg, exampleDir);
  await buildPluginPackage(pkg, pluginDir);
  await assertEasycomLayout(pluginDir);
  await assertPortableImports(pluginDir);
  await assertStandaloneExample(exampleDir, pluginDir);

  consola.success(chalk.green(`Publish workspace: ${exampleDir}`));
  consola.success(chalk.green(`Plugin directory: ${relative(cwd(), pluginDir)}`));
}

build().catch((error) => {
  consola.error("Failed to build the DCloud publish workspace", error);
  process.exitCode = 1;
});