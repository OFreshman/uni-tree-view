<template>
  <scroll-view
    class="docs-scene-tabs"
    scroll-x
    :scroll-into-view="`scene-tab-${modelValue}`"
    :show-scrollbar="false">
    <view class="docs-scene-tabs__track">
      <button
        v-for="scene in demoSceneKeys"
        :id="`scene-tab-${scene}`"
        :key="scene"
        class="docs-scene-tabs__item"
        :class="{ 'is-active': modelValue === scene }"
        @click="selectScene(scene)">
        <text class="docs-scene-tabs__index">
          {{ demoSceneMeta[scene].index }}
        </text>
        <text>{{ demoSceneMeta[scene].shortTitle }}</text>
      </button>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import type { DemoScene } from "./scenes";
import { demoSceneKeys, demoSceneMeta } from "./scenes";

interface Props {
  modelValue: DemoScene;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: DemoScene];
}>();

function selectScene(scene: DemoScene) {
  if (scene !== props.modelValue) {
    emit("update:modelValue", scene);
  }
}
</script>

<style lang="scss">
.docs-scene-tabs {
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  width: 100%;
  height: 82rpx;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1rpx solid rgba(19, 55, 36, 0.07);
}

.docs-scene-tabs__track {
  display: inline-flex;
  gap: 8rpx;
  align-items: center;
  height: 82rpx;
  padding: 0 20rpx;
}

button.docs-scene-tabs__item {
  position: relative;
  display: inline-flex;
  gap: 7rpx;
  align-items: center;
  width: auto;
  min-width: auto;
  height: 52rpx;
  padding: 0 16rpx;
  margin: 0;
  color: #6c7770;
  font-size: 19rpx;
  line-height: 50rpx;
  white-space: nowrap;
  background: transparent;
  border: 1rpx solid transparent;
  border-radius: 999rpx;
}

button.docs-scene-tabs__item::after {
  display: none;
}

button.docs-scene-tabs__item.is-active {
  color: #1f7850;
  font-weight: 650;
  background: #eaf7f0;
  border-color: #c2e4d1;
}

.docs-scene-tabs__index {
  color: #9aa49e;
  font-size: 15rpx;
  font-variant-numeric: tabular-nums;
}

.docs-scene-tabs__item.is-active .docs-scene-tabs__index {
  color: #299764;
}
</style>