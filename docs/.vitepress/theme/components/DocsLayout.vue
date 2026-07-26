<template>
  <DefaultTheme.Layout>
    <template #aside-top>
      <DemoPreview v-if="demoVisible"></DemoPreview>
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { computed } from "vue";
import DemoPreview from "./DemoPreview.vue";

const { frontmatter, page } = useData();

const demoVisible = computed(() => {
  return page.value.relativePath.startsWith("examples/")
    && typeof frontmatter.value.demo === "string";
});
</script>