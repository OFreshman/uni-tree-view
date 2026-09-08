// @env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { getPnpmCommand } from "./pnpm-utils";

export interface OutputFile {
  path: string;
  contents: Uint8Array;
}

export interface OutputSize {
  files: number;
  rawBytes: number;
  gzipBytes: number;
}

export function measureOutput(files: OutputFile[]): OutputSize {
  const runtimeFiles = files.filter((file) => !file.path.endsWith(".map")
    && !/(?:^|\/)project(?:\.private)?\.config\.json$/.test(file.path));
  return runtimeFiles.reduce((size, file) => ({
    files: size.files + 1,
    rawBytes: size.rawBytes + file.contents.byteLength,
    gzipBytes: size.gzipBytes + gzipSync(file.contents, { level: 9 }).byteLength
  }), { files: 0, rawBytes: 0, gzipBytes: 0 });
}

export function componentIncrement(baseline: OutputSize, withComponent: OutputSize): OutputSize {
  const increment = {
    files: withComponent.files - baseline.files,
    rawBytes: withComponent.rawBytes - baseline.rawBytes,
    gzipBytes: withComponent.gzipBytes - baseline.gzipBytes
  };
  if (baseline.files === 0 || increment.rawBytes <= 0 || increment.gzipBytes <= 0) {
    throw new Error("The fixture must build both a non-empty baseline and a larger component application.");
  }
  return increment;
}

const platforms = ["h5", "mp-weixin", "mp-alipay"] as const;

// 按最小工程的实际构建结果留出维护余量，不拿演示站或文档站的大小作上限。
// gzip 是常见 Web 传输压缩格式；小程序只限制未压缩的运行产物字节数。
export const ComponentSizeBudgets: Record<(typeof platforms)[number], { rawBytes: number; gzipBytes?: number }> = {
  "h5": { rawBytes: 80 * 1024, gzipBytes: 26 * 1024 },
  "mp-weixin": { rawBytes: 48 * 1024 },
  "mp-alipay": { rawBytes: 80 * 1024 }
};

export function assertComponentSize(platform: (typeof platforms)[number], increment: OutputSize): void {
  const budget = ComponentSizeBudgets[platform];
  if (!Number.isSafeInteger(increment.rawBytes) || increment.rawBytes <= 0
    || !Number.isSafeInteger(increment.gzipBytes) || increment.gzipBytes <= 0
    || increment.rawBytes > budget.rawBytes
    || (budget.gzipBytes !== undefined && increment.gzipBytes > budget.gzipBytes)) {
    throw new Error(`${platform} component size exceeds its budget. Review artifacts/component-size/report.json before adjusting the limits.`);
  }
}

function write(directory: string, file: string, contents: string): void {
  const destination = path.join(directory, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
}

function createFixture(directory: string, withComponent: boolean, dependencies: string): void {
  mkdirSync(directory, { recursive: true });
  const modules = path.join(directory, "node_modules");
  // 目录链接让依赖看起来位于最小工程内，符合小程序编译器的相对路径约定；不会复制依赖。
  if (!existsSync(modules)) {
    symlinkSync(dependencies, modules, process.platform === "win32" ? "junction" : "dir");
  }
  write(directory, "index.html", "<!doctype html><html><head><meta charset=\"UTF-8\"><title>Size fixture</title></head><body><div id=\"app\"></div><script type=\"module\" src=\"/src/main.ts\"></script></body></html>");
  write(directory, "src/main.ts", "import { createSSRApp } from \"vue\";\nimport App from \"./App.vue\";\nexport function createApp() { return { app: createSSRApp(App) }; }");
  write(directory, "src/App.vue", "<script setup lang=\"ts\">\nimport { onLaunch } from \"@dcloudio/uni-app\";\nonLaunch(() => {});\n</script>");
  write(directory, "src/pages.json", JSON.stringify({
    pages: [{ path: "pages/index/index", style: { navigationStyle: "custom" } }]
  }));
  write(directory, "src/manifest.json", JSON.stringify({
    name: "Component size fixture",
    appid: "",
    versionName: "0.0.0",
    versionCode: "1",
    vueVersion: "3",
    h5: { router: { mode: "hash" } },
    "mp-weixin": { appid: "", setting: { urlCheck: false } },
    "mp-alipay": { appid: "" }
  }));
  write(directory, "src/pages/index/index.vue", withComponent
    ? "<script setup lang=\"ts\">\nimport UniTreeView from \"uni-tree-view\";\n</script>\n<template><view><UniTreeView /></view></template>"
    : "<template><view /></template>");
}

function outputFiles(directory: string, prefix = ""): OutputFile[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? outputFiles(file, relative)
      : [{ path: relative, contents: readFileSync(file) }];
  });
}

function main(): void {
  const root = process.cwd();
  // 最小工程和报告都放在生成物目录中，避免被 DCloud 示例工程打包带走。
  // 目录链接只复用演示工程的构建依赖，不导入其中的页面或业务代码。
  const destination = path.join(root, "artifacts", "component-size");
  mkdirSync(destination, { recursive: true });
  const fixtures = mkdtempSync(path.join(destination, "fixture-"));
  symlinkSync(path.join(root, "playground", "node_modules"), path.join(fixtures, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const report: Record<string, { baseline: OutputSize; withComponent: OutputSize; increment: OutputSize }> = {};
  try {
    const config = path.join(fixtures, "vite.config.mjs");
    write(fixtures, "vite.config.mjs", `import Uni from "@dcloudio/vite-plugin-uni";
export default {
  root: process.env.VITE_ROOT_DIR,
  base: "/",
  publicDir: false,
  plugins: [Uni.default()],
  css: { preprocessorOptions: { scss: { api: "modern-compiler", silenceDeprecations: ["legacy-js-api"] } } },
  build: { target: "es6", cssTarget: "chrome61", sourcemap: false, emptyOutDir: true }
};`);
    for (const platform of platforms) {
      const sizes: OutputSize[] = [];
      for (const variant of ["baseline", "component"] as const) {
        const fixture = path.join(fixtures, variant);
        createFixture(fixture, variant === "component", path.join(root, "playground", "node_modules"));
        const output = path.join(destination, platform, variant);
        const pnpm = getPnpmCommand([
          "-C",
          "playground",
          "exec",
          "uni",
          "build",
          "-p",
          platform,
          "--config",
          config,
          "--outDir",
          output
        ]);
        console.log(`Measuring ${platform}: ${variant}`);
        const result = spawnSync(pnpm.command, pnpm.args, {
          cwd: root,
          env: {
            ...process.env,
            NODE_ENV: "production",
            VITE_ROOT_DIR: fixture,
            UNI_INPUT_DIR: path.join(fixture, "src"),
            UNI_OUTPUT_DIR: output
          },
          encoding: "utf8",
          maxBuffer: 10 * 1024 * 1024,
          timeout: 120_000
        });
        if (result.error || result.status !== 0) {
          throw new Error(`${platform}/${variant} build failed: ${result.error?.message ?? result.status}\n${result.stdout}\n${result.stderr}`);
        }
        sizes.push(measureOutput(outputFiles(output)));
      }
      const [baseline, withComponent] = sizes;
      report[platform] = { baseline, withComponent, increment: componentIncrement(baseline, withComponent) };
    }
    const core = JSON.parse(readFileSync(path.join(root, "packages", "core", "package.json"), "utf8")) as { version: string };
    write(destination, "report.json", `${JSON.stringify({
      componentVersion: core.version,
      node: process.version,
      method: "Production minimal-app difference; gzip is the sum of separately compressed files; source maps and devtools project configs excluded.",
      budgets: ComponentSizeBudgets,
      platforms: report
    }, null, 2)}\n`);
    for (const platform of platforms) {
      const result = report[platform];
      console.log(`${platform}: +${result.increment.rawBytes} bytes raw; +${result.increment.gzipBytes} bytes gzip.`);
    }
    console.log(`Component size report: ${path.relative(root, path.join(destination, "report.json"))}`);
    for (const platform of platforms) {
      assertComponentSize(platform, report[platform].increment);
    }
    console.log("Final component size budgets passed.");
  } finally {
    rmSync(fixtures, { recursive: true, force: true });
  }
}

// 导入函数做单元测试时不执行命令；只有直接运行此文件才启动检查。
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}