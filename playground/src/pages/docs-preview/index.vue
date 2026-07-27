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

      <demo-scene-tabs v-model="scene"></demo-scene-tabs>

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
import DemoSceneTabs from "@/components/docs-demos/DemoSceneTabs.vue";
import FilterDemo from "@/components/docs-demos/FilterDemo.vue";
import LazyLoadDemo from "@/components/docs-demos/LazyLoadDemo.vue";
import type { DemoScene } from "@/components/docs-demos/scenes";
import { demoSceneMeta, isDemoScene } from "@/components/docs-demos/scenes";
import SelectionDemo from "@/components/docs-demos/SelectionDemo.vue";
import SlotsDemo from "@/components/docs-demos/SlotsDemo.vue";
import VirtualDemo from "@/components/docs-demos/VirtualDemo.vue";

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
  position: relative;
  box-sizing: border-box;
  height: 100vh;
  overflow: hidden;
  color: #17211b;
  font-family: var(--font-global);
  background:
    radial-gradient(circle at 92% 2%, rgba(60, 185, 122, 0.16), transparent 27%),
    linear-gradient(180deg, #f7faf8 0%, #f1f6f3 100%);
}

.docs-preview-page::after {
  position: absolute;
  right: -100rpx;
  bottom: 80rpx;
  width: 280rpx;
  height: 280rpx;
  background: rgba(41, 151, 100, 0.04);
  border: 1rpx solid rgba(41, 151, 100, 0.07);
  border-radius: 50%;
  content: "";
  pointer-events: none;
}

.docs-preview-header {
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 104rpx;
  padding: 0 24rpx;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1rpx solid rgba(19, 55, 36, 0.07);
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
  width: 58rpx;
  height: 58rpx;
}

.docs-preview-header__copy {
  min-width: 0;
}

.docs-preview-header__title {
  overflow: hidden;
  color: #17211b;
  font-size: 27rpx;
  font-weight: 700;
  line-height: 34rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.docs-preview-header__description {
  margin-top: 2rpx;
  color: #7a857e;
  font-size: 19rpx;
  line-height: 26rpx;
}

.docs-preview-header__live {
  display: flex;
  flex: 0 0 auto;
  gap: 8rpx;
  align-items: center;
  padding: 7rpx 13rpx;
  color: #237e54;
  font-size: 17rpx;
  font-weight: 750;
  letter-spacing: 1rpx;
  background: #edf8f2;
  border: 1rpx solid #cce8d8;
  border-radius: 999rpx;
}

.docs-preview-header__live-dot {
  width: 8rpx;
  height: 8rpx;
  background: #2ca76c;
  border-radius: 50%;
  box-shadow: 0 0 0 5rpx rgba(44, 167, 108, 0.12);
}

.docs-preview-content {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  height: calc(100vh - 186rpx);
}

.docs-preview-scene {
  padding: 22rpx 22rpx 46rpx;
  animation: DocsSceneEnter 0.28s ease both;
}

.docs-preview-intro {
  position: relative;
  padding: 24rpx;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(135deg, #1d6f4a 0%, #299764 58%, #3fb77c 100%);
  border-radius: 24rpx;
  box-shadow: 0 16rpx 34rpx rgba(28, 111, 74, 0.17);
}

.docs-preview-intro::before,
.docs-preview-intro::after {
  position: absolute;
  border: 1rpx solid rgba(255, 255, 255, 0.13);
  border-radius: 50%;
  content: "";
}

.docs-preview-intro::before {
  top: -62rpx;
  right: -34rpx;
  width: 180rpx;
  height: 180rpx;
}

.docs-preview-intro::after {
  right: 44rpx;
  bottom: -88rpx;
  width: 150rpx;
  height: 150rpx;
}

.docs-preview-intro__topline {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.docs-preview-intro__eyebrow,
.docs-preview-intro__index {
  font-size: 16rpx;
  font-weight: 700;
  line-height: 24rpx;
  letter-spacing: 1.4rpx;
  opacity: 0.72;
}

.docs-preview-intro__title {
  position: relative;
  z-index: 1;
  margin-top: 11rpx;
  font-size: 34rpx;
  font-weight: 750;
  line-height: 44rpx;
  letter-spacing: -0.5rpx;
}

.docs-preview-intro__description {
  position: relative;
  z-index: 1;
  max-width: 88%;
  margin-top: 7rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 20rpx;
  line-height: 31rpx;
}

.docs-preview-intro__tags {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 9rpx;
  margin-top: 17rpx;
}

.docs-preview-intro__tag {
  padding: 5rpx 11rpx;
  color: rgba(255, 255, 255, 0.88);
  font-size: 16rpx;
  line-height: 23rpx;
  background: rgba(255, 255, 255, 0.12);
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 999rpx;
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
</style>