<template>
  <view class="docs-demo-stack">
    <view class="docs-demo-metric">
      <view class="docs-demo-metric__item">
        <view class="docs-demo-metric__value">{{ nodeCount }}</view>
        <view class="docs-demo-metric__label">总节点数</view>
      </view>
      <view class="docs-demo-metric__item">
        <view class="docs-demo-metric__value">{{ depthText }}</view>
        <view class="docs-demo-metric__label">随机层级</view>
      </view>
      <view class="docs-demo-metric__item">
        <view class="docs-demo-metric__value">{{ selectedText }}</view>
        <view class="docs-demo-metric__label">当前已选</view>
      </view>
    </view>

    <view class="docs-demo-toolbar docs-demo-toolbar--space">
      <text class="docs-demo-caption">固定种子 · 随机分支 · 可视区渲染</text>
      <button class="docs-demo-chip is-active" @click="locateTarget">
        定位 6 级节点
      </button>
    </view>

    <view class="docs-demo-card">
      <view class="docs-demo-card__header">
        <text class="docs-demo-card__title">万级区域树</text>
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
        check-on-click-node
        expand-on-click-node
        virtual
        default-expand-all
        :virtual-height="320"
        :virtual-item-height="36"
        :virtual-overscan="12"
        :data="treeData"
        theme-color="#299764"></uni-tree-view>
    </view>

    <view class="docs-demo-status">
      <view class="docs-demo-status__icon"></view>
      <view class="docs-demo-status__content">
        <text class="docs-demo-status__title">{{ locateMessage }}</text>
        <text class="docs-demo-status__detail">实时预览与 pnpm play 共用同一份数据生成器</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import UniTreeView from "uni-tree-view";
import type { UniTreeViewExposed } from "uni-tree-view";
import { computed, shallowRef } from "vue";
import type { DemoTreeKey } from "./data";
import { createLargeTreeData } from "@/utils/largeTreeData";

const largeTree = createLargeTreeData();
const treeRef = shallowRef<UniTreeViewExposed | null>(null);
const checkedValue = shallowRef<DemoTreeKey[]>([]);
const treeData = shallowRef(largeTree.data);
const nodeCount = largeTree.count.toLocaleString();
const depthText = `${largeTree.minDepth}-${largeTree.maxDepth} 层`;
const locateMessage = shallowRef(`可定位目标：${largeTree.targetLabel}`);
const selectedText = computed(() => checkedValue.value.length ? `${checkedValue.value.length} 项` : "0 项");

async function locateTarget() {
  const located = await treeRef.value?.scrollToKey(largeTree.targetKey, { expandParents: true });
  locateMessage.value = located ? `已定位：${largeTree.targetLabel}` : "目标节点定位失败";
}
</script>

<style lang="scss">
@use "./demo.scss";
</style>