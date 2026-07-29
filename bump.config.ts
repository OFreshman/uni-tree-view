import { defineConfig } from "bumpp";

export default defineConfig({
  all: true,
  commit: "chore: release v%s",
  execute: "pnpm release:prepare",
  printCommits: false,
  push: false,
  recursive: true,
  tag: "v%s"
});