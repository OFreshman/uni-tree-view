<template>
  <section
    class="DemoPreview"
    :class="[`DemoPreview--${variant}`, { 'is-collapsed': !expanded }]"
    :aria-label="`${title}实时演示`">
    <!-- 工具条：aside 形态下是纯标题栏；inline 形态下整条可点击折叠/展开 -->
    <div class="DemoPreview__toolbar" @click="onToolbarClick">
      <div class="DemoPreview__toolbar-copy">
        <span class="DemoPreview__status-dot" aria-hidden="true"></span>
        <span class="DemoPreview__label">实时预览</span>
        <span class="DemoPreview__scene">{{ title }}</span>
      </div>
      <div class="DemoPreview__toolbar-actions">
        <span class="DemoPreview__badge">H5</span>
        <button
          v-if="expanded"
          class="DemoPreview__action"
          type="button"
          title="重新载入案例"
          :aria-label="`重新载入${title}案例`"
          :disabled="isLoading"
          @click.stop="reloadPreview">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11a8 8 0 1 0-2.34 5.66M20 5v6h-6"></path>
          </svg>
        </button>
        <button
          v-if="collapsible"
          class="DemoPreview__action DemoPreview__toggle"
          type="button"
          :title="expanded ? '收起预览' : '展开预览'"
          :aria-label="expanded ? `收起${title}预览` : `展开${title}预览`"
          :aria-expanded="expanded"
          @click.stop="toggle">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- device 无自身边框圆角，iframe 直接贴合外层卡片边界；
         inline 形态折叠时整块隐藏，iframe 首次展开才挂载（懒加载） -->
    <div v-show="expanded" class="DemoPreview__device" title="可点击、输入、切换场景">
      <div v-if="isLoading" class="DemoPreview__loading" aria-hidden="true">
        <span class="DemoPreview__spinner"></span>
        <span class="DemoPreview__loading-text">加载中</span>
      </div>
      <iframe
        v-if="hasOpened"
        :key="iframeKey"
        class="DemoPreview__iframe"
        :class="{ 'is-loading': isLoading }"
        :src="href"
        :title="`${title}实时演示`"
        loading="eager"
        sandbox="allow-forms allow-modals allow-same-origin allow-scripts"
        @load="isLoading = false"></iframe>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useData, useRoute, withBase } from "vitepress";
import { computed, shallowRef, watch } from "vue";
import type { PropType } from "vue";

interface DemoFrontmatter {
  demo?: string;
  demoTitle?: string;
}

const props = defineProps({
  /** aside：宽屏时挂在右侧大纲栏上方；inline：窄屏时嵌在正文顶部，可折叠 */
  variant: {
    type: String as PropType<"aside" | "inline">,
    default: "aside"
  }
});

const { frontmatter } = useData<DemoFrontmatter>();
const route = useRoute();
const reloadKey = shallowRef(0);
const isLoading = shallowRef(true);

/* inline 形态默认折叠，避免在窄屏把正文顶下去；aside 形态始终展开 */
const collapsible = computed(() => props.variant === "inline");
const expanded = shallowRef(props.variant === "aside");
/* iframe 懒挂载标记：首次展开后才创建 iframe，之后折叠仅 v-show 隐藏 */
const hasOpened = shallowRef(expanded.value);

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

watch(expanded, (value) => {
  if (value) {
    hasOpened.value = true;
  }
});

function toggle() {
  expanded.value = !expanded.value;
}

function onToolbarClick() {
  if (collapsible.value) {
    toggle();
  }
}

function reloadPreview() {
  isLoading.value = true;
  reloadKey.value += 1;
}
</script>

<style scoped>
/* ─── 外层：单一卡片，一套边框 + 圆角 + 阴影，overflow hidden 统一裁切子元素 ─── */

.DemoPreview {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  box-shadow: var(--vp-shadow-2);
}

/* aside 形态：回归文档流，跟随主题 aside-container（其本身已 fixed + 可滚动），
   不再需要 fixed / 负 margin 定位 hack，宽度自动等于加宽后的 aside 内容区 */
.DemoPreview--aside {
  width: 100%;
  margin-bottom: 24px;
}

/* aside 容器在 <1440px 时仍是默认 224px，放不下预览：
   直接隐藏，改由 DocsLayout 在正文中渲染 inline 形态（也规避水合前闪烁） */
@media (max-width: 1439px) {
  .DemoPreview--aside {
    display: none;
  }
}

/* inline 形态：嵌在正文顶部，与标题左对齐，限宽保持手机比例 */
.DemoPreview--inline {
  width: min(100%, 420px);
  margin: 4px 0 32px;
}

/* ─── Toolbar：仅靠一条底部分隔线与 device 区分 ───────── */

.DemoPreview__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 14px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

/* inline 形态整条工具栏可点击折叠/展开 */
.DemoPreview--inline .DemoPreview__toolbar {
  cursor: pointer;
  user-select: none;
}

/* 折叠时下方没有 device，去掉分隔线避免出现"双底边" */
.DemoPreview.is-collapsed .DemoPreview__toolbar {
  border-bottom: 0;
}

.DemoPreview__toolbar-copy {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  font-size: 12px;
}

.DemoPreview__toolbar-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

/* 状态点：纯色圆点传达"实时"含义 */
.DemoPreview__status-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  background: var(--vp-c-brand-1);
  border-radius: 50%;
}

.DemoPreview__label {
  font-weight: 600;
  white-space: nowrap;
}

/* 场景名：仅靠颜色区分主次 */
.DemoPreview__scene {
  max-width: 140px;
  overflow: hidden;
  color: var(--vp-c-text-3);
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.DemoPreview__badge {
  padding: 2px 7px;
  color: var(--vp-c-text-3);
  font-size: 10px;
  font-weight: 600;
  background: var(--vp-c-bg-mute);
  border-radius: 999px;
}

/* ─── 工具按钮（重载 / 折叠）───────────────────────── */

.DemoPreview__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  color: var(--vp-c-text-3);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
  transition: color 0.2s, background-color 0.2s, opacity 0.2s;
}

.DemoPreview__action:hover:not(:disabled) {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.DemoPreview__action:active:not(:disabled) svg {
  animation: DemoPreviewSpin 0.4s ease-out forwards;
}

.DemoPreview__action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.DemoPreview__action:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

.DemoPreview__action svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

/* 折叠按钮箭头：展开时朝上、折叠时朝下，不复用旋转动画 */
.DemoPreview__toggle:active:not(:disabled) svg {
  animation: none;
}

.DemoPreview__toggle svg {
  transition: transform 0.2s ease;
}

.DemoPreview:not(.is-collapsed) .DemoPreview__toggle svg {
  transform: rotate(180deg);
}

/* ─── Device：无内边距、无自身边框圆角，iframe 贴合外层容器边界 ─── */

.DemoPreview__device {
  position: relative;
  flex: none;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

/* aside 形态高度随视口伸缩：预留导航 + aside 顶部留白 + 工具条 + 底部呼吸空间，
   保证卡片整体不超出一屏，超短屏兜底 430px（aside 自身可滚动） */
.DemoPreview--aside .DemoPreview__device {
  height: clamp(430px, calc(100vh - 236px), 700px);
}

/* inline 形态偏保守，展开后仍能看到下方正文 */
.DemoPreview--inline .DemoPreview__device {
  height: clamp(400px, 62vh, 620px);
}

.DemoPreview__iframe {
  display: block;
  width: 100%;
  height: 100%;
  background: transparent;
  border: 0;
  opacity: 1;
  transition: opacity 0.25s ease;
}

.DemoPreview__iframe.is-loading {
  opacity: 0;
}

/* ─── Loading：居中 spinner + 文字 ────────────────── */

.DemoPreview__loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.DemoPreview__spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: DemoPreviewRotate 0.8s linear infinite;
}

.DemoPreview__loading-text {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

/* ─── 动画 ───────────────────────────────────────── */

@keyframes DemoPreviewSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes DemoPreviewRotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ─── 无障碍：减少动效 ────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .DemoPreview__iframe,
  .DemoPreview__action svg,
  .DemoPreview__spinner {
    transition: none;
    animation: none;
  }
}
</style>