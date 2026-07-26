import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import DocsLayout from "./components/DocsLayout.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: DocsLayout
} satisfies Theme;