import { defineBuildConfig } from "unbuild";

export default defineBuildConfig([
  {
    name: "uni-tree-list",
    entries: [
      "src/index.js"
    ],
    outDir: "dist",
    clean: false,
    declaration: true,
    externals: [
      "vue"
    ],
    failOnWarn: false
  },
  {
    name: "uni-tree-list/resolver",
    entries: [
      "resolver/index.ts"
    ],
    outDir: "dist-resolver",
    clean: false,
    declaration: true,
    externals: [
      "@uni-helper/vite-plugin-uni-components"
    ],
    failOnWarn: false,
    rollup: {
      emitCJS: true
    }
  }
]);