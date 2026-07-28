import defineConfig from "@xiaohe01/eslint-config";

export default defineConfig({
  pnpm: true,
  vue: {
    overrides: {
      "vue/custom-event-name-casing": "off"
    }
  },
  ignores: [
    "**/*.md",
    "./**/*.min.js",
    "**/dist-resolver",
    "artifacts",
    "docs/public/ui",
    "docs/.vitepress/config.ts.timestamp-*.mjs",
    "playground/src/uni_modules",
    ".claude"
  ]
}, {
  files: ["docs/**/*.vue"],
  rules: {
    "vue/component-name-in-template-casing": ["error", "PascalCase"]
  }
});