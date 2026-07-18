import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import Uni from "@dcloudio/vite-plugin-uni";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";

function r(...paths: string[]) {
  return path.resolve(process.cwd(), ".", ...paths);
}

function getComponentVersion() {
  const packageJson = JSON.parse(readFileSync(r("..", "packages", "core", "package.json"), "utf8")) as {
    version: string;
  };
  return packageJson.version;
}

function buildTransformAssetUrls() {
  return {
    tags: {
      "wd-img": ["src"]
    }
  };
}

function buildPlugins(): PluginOption[] {
  return [
    // @ts-expect-error whatever
    Uni.default({
      vueOptions: {
        template: {
          transformAssetUrls: buildTransformAssetUrls()
        }
      }
    })
  ];
}

export default defineConfig({
  root: process.cwd(),
  base: process.env.UNI_PLATFORM === "h5" ? "/ui/" : "/",
  define: {
    __UNI_TREE_VIEW_VERSION__: JSON.stringify(getComponentVersion())
  },
  resolve: {
    alias: {
      "@": r("src")
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // wot-ui v2 依赖 sass >= 1.78，使用 modern-compiler 避免 legacy-js-api 警告
        api: "modern-compiler",
        silenceDeprecations: ["legacy-js-api"]
      }
    }
  },
  plugins: buildPlugins(),
  build: {
    target: "es6",
    cssTarget: "chrome61"
  }
});