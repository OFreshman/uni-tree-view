<template>
  <view class="docs-demo-stack">
    <view class="docs-demo-section-label">
      <text>交互偏好</text>
      <text class="docs-demo-section-label__value">可实时切换</text>
    </view>

    <view class="docs-demo-toolbar">
      <button
        class="docs-demo-chip"
        :class="{ 'is-active': wholeRow }"
        @click="wholeRow = !wholeRow">
        <view class="docs-demo-chip__dot"></view>
        {{ interactionText }}
      </button>
      <button
        class="docs-demo-chip"
        :class="{ 'is-active': showPath }"
        @click="showPath = !showPath">
        <view class="docs-demo-chip__dot"></view>
        显示路径
      </button>
    </view>

    <view class="docs-demo-card">
      <view class="docs-demo-card__header">
        <text class="docs-demo-card__title">部门结构</text>
        <view class="docs-demo-card__meta">
          <view class="docs-demo-card__meta-dot"></view>
          默认展开指定节点
        </view>
      </view>
      <uni-tree-view
        :data="demoTreeData"
        :default-expanded-keys="['frontend']"
        :expand-on-click-node="wholeRow"
        :show-path="showPath"
        path-separator=" / "
        theme-color="#299764"
        @node-click="latestAction = `刚刚点击了「${$event.node.label}」`"></uni-tree-view>
    </view>

    <view class="docs-demo-status">
      <view class="docs-demo-status__icon"></view>
      <view class="docs-demo-status__content">
        <text class="docs-demo-status__title">{{ latestAction }}</text>
        <text class="docs-demo-status__detail">
          {{ wholeRow ? "点击节点文字也可展开" : "当前仅箭头控制展开" }} · {{ pathText }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import UniTreeView from "uni-tree-view";
import { computed, shallowRef } from "vue";
import { demoTreeData } from "./data";

const showPath = shallowRef(false);
const wholeRow = shallowRef(false);
const latestAction = shallowRef("等待操作");
const interactionText = computed(() => wholeRow.value ? "整行展开" : "箭头展开");
const pathText = computed(() => showPath.value ? "路径已显示" : "路径已隐藏");
</script>

<style lang="scss">
@use "./demo.scss";
</style>