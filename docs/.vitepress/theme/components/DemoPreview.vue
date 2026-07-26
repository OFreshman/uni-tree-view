<template>
  <section class="DemoPreview" :aria-label="`${title}实时演示`">
    <div class="DemoPreview__toolbar">
      <div class="DemoPreview__toolbar-copy">
        <span class="DemoPreview__status-dot"></span>
        <span>互动预览</span>
        <span class="DemoPreview__scene">{{ title }}</span>
      </div>
      <button
        class="DemoPreview__reload"
        type="button"
        title="重新载入案例"
        :aria-label="`重新载入${title}案例`"
        @click="reloadPreview">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11a8 8 0 1 0-2.34 5.66M20 5v6h-6"></path>
        </svg>
      </button>
    </div>

    <div class="DemoPreview__device">
      <div v-if="isLoading" class="DemoPreview__loading" aria-hidden="true">
        <span class="DemoPreview__loading-mark">T</span>
        <span class="DemoPreview__loading-line"></span>
        <span class="DemoPreview__loading-line DemoPreview__loading-line--short"></span>
      </div>
      <iframe
        :key="iframeKey"
        class="DemoPreview__iframe"
        :class="{ 'is-loading': isLoading }"
        :src="href"
        :title="`${title}实时演示`"
        loading="eager"
        sandbox="allow-forms allow-modals allow-same-origin allow-scripts"
        @load="isLoading = false"></iframe>
    </div>

    <div class="DemoPreview__footer">
      <span>可点击、输入和切换场景</span>
      <span class="DemoPreview__footer-badge">H5</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useData, useRoute, withBase } from "vitepress";
import { computed, shallowRef, watch } from "vue";

interface DemoFrontmatter {
  demo?: string;
  demoTitle?: string;
}

const { frontmatter } = useData<DemoFrontmatter>();
const route = useRoute();
const reloadKey = shallowRef(0);
const isLoading = shallowRef(true);

const routeScene = computed(() => {
  const match = route.path.match(/\/examples\/([^/.]+)/);
  return match?.[1] ?? "basic";
});
const scene = computed(() => frontmatter.value.demo ?? routeScene.value);
const title = computed(() => frontmatter.value.demoTitle ?? "组件演示");
const iframeKey = computed(() => `${scene.value}-${reloadKey.value}`);
const href = computed(() => {
  const path = `/#/pages/docs-preview/index?scene=${encodeURIComponent(scene.value)}`;

  if (import.meta.env.DEV) {
    const base = import.meta.env.VITE_DEMO_URL || "http://localhost:9861/ui";
    return `${base.replace(/\/$/, "")}${path}`;
  }

  return withBase(`/ui${path}`);
});

watch(scene, () => {
  isLoading.value = true;
});

function reloadPreview() {
  isLoading.value = true;
  reloadKey.value += 1;
}
</script>

<style scoped>
.DemoPreview {
  position: fixed;
  z-index: 10;
  top: 84px;
  display: flex;
  flex-direction: column;
  width: 372px;
  margin-left: -112px;
  color: var(--vp-c-text-2);
}

.DemoPreview__toolbar,
.DemoPreview__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.DemoPreview__toolbar {
  height: 38px;
  padding: 0 10px 0 12px;
  background: color-mix(in srgb, var(--vp-c-bg) 92%, transparent);
  border: 1px solid var(--vp-c-divider);
  border-bottom: 0;
  border-radius: 18px 18px 0 0;
}

.DemoPreview__toolbar-copy {
  display: flex;
  gap: 7px;
  align-items: center;
  min-width: 0;
  font-size: 12px;
  font-weight: 650;
}

.DemoPreview__status-dot {
  width: 7px;
  height: 7px;
  background: #299764;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(41, 151, 100, 0.12);
}

.DemoPreview__scene {
  max-width: 132px;
  padding-left: 7px;
  overflow: hidden;
  color: var(--vp-c-text-3);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-left: 1px solid var(--vp-c-divider);
}

.DemoPreview__reload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--vp-c-text-3);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition: color 0.2s, background-color 0.2s, transform 0.2s;
}

.DemoPreview__reload:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.DemoPreview__reload:active {
  transform: rotate(24deg);
}

.DemoPreview__reload:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

.DemoPreview__reload svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.DemoPreview__device {
  position: relative;
  box-sizing: border-box;
  width: 372px;
  height: 650px;
  padding: 7px;
  overflow: hidden;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  box-shadow:
    0 24px 55px rgba(15, 23, 42, 0.13),
    0 4px 12px rgba(15, 23, 42, 0.07);
}

.DemoPreview__device::after {
  position: absolute;
  inset: 7px;
  z-index: 3;
  border: 1px solid rgba(15, 23, 42, 0.04);
  border-radius: 12px;
  content: "";
  pointer-events: none;
}

.DemoPreview__iframe {
  display: block;
  width: 100%;
  height: 100%;
  background: #f4f8f5;
  border: 0;
  border-radius: 12px;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.DemoPreview__iframe.is-loading {
  opacity: 0;
}

.DemoPreview__loading {
  position: absolute;
  inset: 7px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 32px 24px;
  background: linear-gradient(145deg, #f8fbf9, #eef5f1);
  border-radius: 12px;
}

.DemoPreview__loading-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  margin-bottom: 28px;
  color: #fff;
  font-weight: 750;
  background: linear-gradient(145deg, #38b779, #218657);
  border-radius: 13px;
  box-shadow: 0 10px 24px rgba(35, 132, 88, 0.2);
}

.DemoPreview__loading-line {
  width: 72%;
  height: 12px;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #dce9e1, #eef5f1, #dce9e1);
  background-size: 200% 100%;
  border-radius: 999px;
  animation: DemoPreviewShimmer 1.2s linear infinite;
}

.DemoPreview__loading-line--short {
  width: 46%;
}

.DemoPreview__footer {
  height: 34px;
  padding: 0 11px 0 13px;
  color: var(--vp-c-text-3);
  font-size: 11px;
  background: color-mix(in srgb, var(--vp-c-bg) 94%, transparent);
  border: 1px solid var(--vp-c-divider);
  border-top: 0;
  border-radius: 0 0 18px 18px;
}

.DemoPreview__footer-badge {
  padding: 2px 7px;
  color: var(--vp-c-brand-1);
  font-size: 10px;
  font-weight: 700;
  background: var(--vp-c-brand-soft);
  border-radius: 999px;
}

@keyframes DemoPreviewShimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-height: 820px) {
  .DemoPreview__device {
    height: 590px;
  }
}

@media (max-width: 1439px) {
  .DemoPreview {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .DemoPreview__iframe,
  .DemoPreview__reload,
  .DemoPreview__loading-line {
    transition: none;
    animation: none;
  }
}
</style>