<template>
  <DefaultTheme.Layout>
    <!-- 宽屏（≥1440px）：预览挂在右侧大纲栏上方，随 aside 一起固定 -->
    <template #aside-top>
      <DemoPreview v-if="demoVisible && isWide" variant="aside"></DemoPreview>
    </template>
    <!-- 窄屏：预览以可折叠卡片嵌在正文顶部，笔记本/平板/手机也能看到演示 -->
    <template #doc-before>
      <DemoPreview v-if="demoVisible && !isWide" variant="inline"></DemoPreview>
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { computed, onMounted, onUnmounted, shallowRef } from "vue";
import DemoPreview from "./DemoPreview.vue";

const { frontmatter, page } = useData();

const demoVisible = computed(() => {
  return page.value.relativePath.startsWith("examples/")
    && typeof frontmatter.value.demo === "string";
});

/* 与 custom.css 中加宽 aside 的断点保持一致 */
const WIDE_QUERY = "(min-width: 1440px)";

/* SSR/SSG 阶段默认按宽屏渲染：aside 形态在 <1440px 由 CSS 隐藏，
   不会闪烁；挂载后按真实视口切换，并监听窗口尺寸变化 */
const isWide = shallowRef(true);
let mql: MediaQueryList | undefined;

function onChange(event: MediaQueryListEvent) {
  isWide.value = event.matches;
}

onMounted(() => {
  mql = window.matchMedia(WIDE_QUERY);
  isWide.value = mql.matches;
  mql.addEventListener("change", onChange);
});

onUnmounted(() => {
  mql?.removeEventListener("change", onChange);
});
</script>