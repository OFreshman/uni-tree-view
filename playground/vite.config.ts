import path from "node:path";
import process from "node:process";
import Uni from "@dcloudio/vite-plugin-uni";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";

function r(...paths: string[]) {
  return path.resolve(process.cwd(), ".", ...paths);
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
  resolve: {
    alias: {
      "@": r("src")
    }
  },
  plugins: buildPlugins(),
  build: {
    target: "es6",
    cssTarget: "chrome61"
  }
});