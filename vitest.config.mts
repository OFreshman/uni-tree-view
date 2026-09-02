import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => ["scroll-view", "text", "view"].includes(tag)
        }
      }
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["legacy-js-api"]
      }
    }
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
      // 只统计随包发布的源码。默认的 all: false 会让没被任何测试碰到的文件
      // 完全不出现在报告里，那种「100%」看不出漏测的模块。
      all: true,
      include: ["packages/core/src/**/*.{ts,js,vue}"],
      // index.js / components/index.js 只做再导出，types.* 只有类型（types.js 就是
      // 一行 `export {}`），计进去只会用固定的 0% 稀释真实覆盖率。
      exclude: [
        "packages/core/src/index.js",
        "packages/core/src/components/index.js",
        "**/types.{ts,js}",
        "**/*.d.ts"
      ]
    }
  }
});