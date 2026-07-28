import { defineConfig } from "bumpp";

export default defineConfig({
  all: true,
  commit: "chore: release v%s",
  execute: "pnpm release:prepare",
  push: false,
  recursive: true,
  tag: "v%s"
});