<template>
  <view class="docs-demo-stack">
    <view class="docs-demo-metric">
      <view class="docs-demo-metric__item">
        <view class="docs-demo-metric__value">{{ nodeCount }}</view>
        <view class="docs-demo-metric__label">总节点数</view>
      </view>
      <view class="docs-demo-metric__item">
        <view class="docs-demo-metric__value">{{ selectedText }}</view>
        <view class="docs-demo-metric__label">当前已选</view>
      </view>
    </view>

    <view class="docs-demo-toolbar docs-demo-toolbar--space">
      <text class="docs-demo-caption">固定行高 · 可视区渲染</text>
      <button class="docs-demo-chip is-active" @click="locateTarget">
        定位目标
      </button>
    </view>

    <view class="docs-demo-card">
      <view class="docs-demo-card__header">
        <text class="docs-demo-card__title">大型组织树</text>
        <view class="docs-demo-card__meta">
          <view class="docs-demo-card__meta-dot"></view>
          virtual
        </view>
      </view>
      <uni-tree-view
        ref="treeRef"
        v-model="checkedValue"
        show-checkbox
        multiple
        virtual
        default-expand-all
        :virtual-height="320"
        :virtual-item-height="36"
        :virtual-overscan="8"
        :data="treeData"
        theme-color="#299764"></uni-tree-view>
    </view>

    <view class="docs-demo-status">
      <view class="docs-demo-status__icon"></view>
      <view class="docs-demo-status__content">
        <text class="docs-demo-status__title">{{ locateMessage }}</text>
        <text class="docs-demo-status__detail">仅渲染可见行和少量缓冲节点</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import UniTreeView from "uni-tree-view";
import type { UniTreeViewExposed } from "uni-tree-view/components/uni-tree-view/types";
import { computed, shallowRef } from "vue";
import type { DemoTreeKey } from "./data";
import { createVirtualTreeData } from "./data";

const treeRef = shallowRef<UniTreeViewExposed | null>(null);
const checkedValue = shallowRef<DemoTreeKey[]>([]);
const treeData = shallowRef(createVirtualTreeData());
const nodeCount = 24 + 24 * 18;
const locateMessage = shallowRef("滚动列表或直接定位到第 20 组成员");
const selectedText = computed(() => checkedValue.value.length ? `${checkedValue.value.length} 项` : "0 项");

async function locateTarget() {
  await treeRef.value?.scrollToKey("member-20-12", { expandParents: true });
  locateMessage.value = "已定位：业务团队 20 / 成员 20-12";
}
</script>

<style lang="scss">
@use "./demo.scss";
</style>