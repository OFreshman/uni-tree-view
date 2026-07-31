<template>
  <app-page>
    <view class="docs-preview-page">
      <view class="docs-preview-header">
        <view class="docs-preview-header__brand">
          <image
            class="docs-preview-header__logo"
            src="/static/uni-tree-view-logo.png"
            mode="aspectFit"></image>
          <view class="docs-preview-header__copy">
            <view class="docs-preview-header__title">
              Uni Tree View
            </view>
            <view class="docs-preview-header__description">
              互动案例台
            </view>
          </view>
        </view>
        <view class="docs-preview-header__live">
          <view class="docs-preview-header__live-dot"></view>
          LIVE
        </view>
      </view>

      <scroll-view class="docs-preview-content" scroll-y :show-scrollbar="false">
        <view :key="scene" class="docs-preview-scene">
          <view class="docs-preview-intro">
            <view class="docs-preview-intro__topline">
              <text class="docs-preview-intro__eyebrow">
                {{ currentMeta.eyebrow }}
              </text>
              <text class="docs-preview-intro__index">
                {{ currentMeta.index }} / 06
              </text>
            </view>
            <view class="docs-preview-intro__title">
              {{ currentMeta.title }}
            </view>
            <view class="docs-preview-intro__description">
              {{ currentMeta.description }}
            </view>
            <view class="docs-preview-intro__tags">
              <text v-for="tag in currentMeta.tags" :key="tag" class="docs-preview-intro__tag">
                {{ tag }}
              </text>
            </view>
          </view>

          <basic-demo v-if="scene === 'basic'"></basic-demo>
          <selection-demo v-else-if="scene === 'selection'"></selection-demo>
          <filter-demo v-else-if="scene === 'filter'"></filter-demo>
          <lazy-load-demo v-else-if="scene === 'lazy-load'"></lazy-load-demo>
          <virtual-demo v-else-if="scene === 'virtual'"></virtual-demo>
          <slots-demo v-else></slots-demo>
        </view>
      </scroll-view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, shallowRef } from "vue";
import AppPage from "@/components/appPage/index.vue";
import BasicDemo from "@/components/docs-demos/BasicDemo.vue";
import FilterDemo from "@/components/docs-demos/FilterDemo.vue";
import LazyLoadDemo from "@/components/docs-demos/LazyLoadDemo.vue";
import type { DemoScene } from "@/components/docs-demos/scenes";
import { demoSceneMeta, isDemoScene } from "@/components/docs-demos/scenes";
import SelectionDemo from "@/components/docs-demos/SelectionDemo.vue";
import SlotsDemo from "@/components/docs-demos/SlotsDemo.vue";
import VirtualDemo from "@/components/docs-demos/VirtualDemo.vue";

/* 场景不再有页内切换入口：由文档左侧示例菜单驱动，
   每个示例页通过 iframe query 传入唯一 scene */
const scene = shallowRef<DemoScene>("basic");
const currentMeta = computed(() => demoSceneMeta[scene.value]);

onLoad((options) => {
  if (isDemoScene(options?.scene)) {
    scene.value = options.scene;
  }
});
</script>

<style lang="scss">
.docs-preview-page {
  box-sizing: border-box;
  height: 100vh;
  overflow: hidden;
  color: #16241c;
  font-family: var(--font-global);
  background: #f5f8f6;
}

.docs-preview-header {
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 104rpx;
  padding: 0 26rpx;
  background: #fbfdfc;
  border-bottom: 1rpx solid rgba(22, 52, 37, 0.08);
}

.docs-preview-header__brand {
  display: flex;
  gap: 16rpx;
  align-items: center;
  min-width: 0;
}

.docs-preview-header__logo {
  display: block;
  flex: 0 0 auto;
  width: 56rpx;
  height: 56rpx;
}

.docs-preview-header__copy {
  min-width: 0;
}

.docs-preview-header__title {
  overflow: hidden;
  color: #16241c;
  font-size: 26rpx;
  font-weight: 700;
  letter-spacing: -0.3rpx;
  line-height: 33rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.docs-preview-header__description {
  margin-top: 3rpx;
  color: #82908a;
  font-size: 18rpx;
  line-height: 24rpx;
  letter-spacing: 2rpx;
}

.docs-preview-header__live {
  display: flex;
  flex: 0 0 auto;
  gap: 9rpx;
  align-items: center;
  padding: 7rpx 14rpx;
  color: #1f7850;
  font-family: var(--font-mono-global);
  font-size: 16rpx;
  font-weight: 700;
  letter-spacing: 2.5rpx;
  background: transparent;
  border: 1rpx solid rgba(41, 151, 100, 0.32);
  border-radius: 999rpx;
}

.docs-preview-header__live-dot {
  width: 8rpx;
  height: 8rpx;
  background: #2ca76c;
  border-radius: 50%;
  animation: DocsLivePulse 2.4s ease-in-out infinite;
}

.docs-preview-content {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  height: calc(100vh - 104rpx);
}

.docs-preview-scene {
  padding: 22rpx 22rpx 46rpx;
  animation: DocsSceneEnter 0.28s ease both;
}

/* 场景卡：墨绿平色，信息按"眉题/序号 → 标题 → 说明 → 标签"分层，
   不做渐变与装饰图形，靠层次与留白立住 */
.docs-preview-intro {
  padding: 26rpx 26rpx 24rpx;
  color: #fff;
  background: #142e21;
  border-radius: 18rpx;
}

.docs-preview-intro__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.docs-preview-intro__eyebrow,
.docs-preview-intro__index {
  color: #7fbf9d;
  font-family: var(--font-mono-global);
  font-size: 16rpx;
  font-weight: 600;
  line-height: 24rpx;
  letter-spacing: 2.2rpx;
}

.docs-preview-intro__index {
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}

.docs-preview-intro__title {
  margin-top: 12rpx;
  font-size: 33rpx;
  font-weight: 750;
  line-height: 43rpx;
  letter-spacing: -0.5rpx;
}

.docs-preview-intro__description {
  max-width: 92%;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.68);
  font-size: 20rpx;
  line-height: 31rpx;
}

.docs-preview-intro__tags {
  display: flex;
  gap: 9rpx;
  margin-top: 19rpx;
  padding-top: 17rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.12);
}

.docs-preview-intro__tag {
  padding: 4rpx 12rpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 16rpx;
  line-height: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  border-radius: 8rpx;
}

@keyframes DocsSceneEnter {
  0% {
    opacity: 0;
    transform: translateY(8rpx);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes DocsLivePulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(44, 167, 108, 0.32);
  }

  50% {
    box-shadow: 0 0 0 6rpx rgba(44, 167, 108, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .docs-preview-scene {
    animation: none;
  }

  .docs-preview-header__live-dot {
    animation: none;
  }
}
</style>