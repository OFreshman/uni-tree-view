<template>
  <view class="docs-demo-stack">
    <view class="docs-demo-section-label">
      <text>异步数据源</text>
      <text class="docs-demo-section-label__value">仅加载一次</text>
    </view>

    <view class="docs-demo-toolbar docs-demo-toolbar--end">
      <button class="docs-demo-chip" @click="resetDemo">
        重新演示
      </button>
    </view>

    <view class="docs-demo-card">
      <view class="docs-demo-card__header">
        <text class="docs-demo-card__title">区域选择</text>
        <view class="docs-demo-card__meta">
          <view class="docs-demo-card__meta-dot"></view>
          按需请求
        </view>
      </view>
      <uni-tree-view
        :key="renderKey"
        load-mode
        selectable
        only-radio-leaf
        check-on-click-node
        :data="rootData"
        :load-api="loadChildren"
        :is-leaf-fn="item => item.leaf === true"
        theme-color="#299764"
        @load="loadMessage = `「${$event.node.label}」已加载 ${$event.children.length} 项`"
        @load-error="loadMessage = `「${$event.node.label}」加载失败`"></uni-tree-view>
    </view>

    <view class="docs-demo-status">
      <view class="docs-demo-status__icon"></view>
      <view class="docs-demo-status__content">
        <text class="docs-demo-status__title">{{ loadTitle }}</text>
        <text class="docs-demo-status__detail">{{ loadDetail }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import UniTreeView from "uni-tree-view";
import { computed, shallowRef } from "vue";
import type { DemoTreeNode } from "./data";

interface LazyTreeNode {
  id: string | number;
  label: string;
}

const renderKey = shallowRef(0);
const loading = shallowRef(false);
const loadMessage = shallowRef("等待展开区域节点");
const rootData: DemoTreeNode[] = [
  { id: "north", label: "华北区域", append: "2 城市" },
  { id: "east", label: "华东区域", append: "3 城市" },
  { id: "south", label: "华南区域", append: "2 城市" }
];

const childrenMap: Record<string, DemoTreeNode[]> = {
  north: [
    { id: "beijing", label: "北京", leaf: true },
    { id: "tianjin", label: "天津", leaf: true }
  ],
  east: [
    { id: "shanghai", label: "上海", leaf: true },
    { id: "hangzhou", label: "杭州", leaf: true },
    { id: "suzhou", label: "苏州", leaf: true }
  ],
  south: [
    { id: "guangzhou", label: "广州", leaf: true },
    { id: "shenzhen", label: "深圳", leaf: true }
  ]
};

const loadTitle = computed(() => loading.value ? "正在请求子节点" : loadMessage.value);
const loadDetail = computed(() => loading.value ? "模拟 650ms 的异步数据请求" : "已加载的节点再次展开不会重复请求");

async function loadChildren(node: LazyTreeNode) {
  loading.value = true;
  loadMessage.value = `正在加载「${node.label}」`;
  await new Promise((resolve) => setTimeout(resolve, 650));
  loading.value = false;
  return childrenMap[String(node.id)] ?? [];
}

function resetDemo() {
  renderKey.value += 1;
  loading.value = false;
  loadMessage.value = "案例已重置，等待重新展开";
}
</script>

<style lang="scss">
@use "./demo.scss";
</style>