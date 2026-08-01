<template>
  <view class="docs-demo-stack">
    <view class="docs-demo-section-label">
      <text>选择模式</text>
      <text class="docs-demo-section-label__value">{{ modeDescription }}</text>
    </view>

    <view class="docs-demo-segment">
      <button
        v-for="item in modes"
        :key="item.key"
        class="docs-demo-segment__item"
        :class="{ 'is-active': mode === item.key }"
        @click="mode = item.key">
        {{ item.label }}
      </button>
    </view>

    <view v-if="isMultipleMode" class="docs-demo-toolbar">
      <button class="docs-demo-chip" @click="checkDesignTeam">
        选中设计组
      </button>
      <button class="docs-demo-chip" @click="clearChecked">
        清空选中
      </button>
    </view>

    <view class="docs-demo-card">
      <view class="docs-demo-card__header">
        <text class="docs-demo-card__title">成员权限</text>
        <view class="docs-demo-card__meta">
          <view class="docs-demo-card__meta-dot"></view>
          双向绑定
        </view>
      </view>
      <uni-tree-view
        v-if="mode === 'single'"
        v-model="singleValue"
        selectable
        check-on-click-node
        default-expand-all
        theme-color="#299764"
        :data="demoTreeData"></uni-tree-view>
      <uni-tree-view
        v-else-if="mode === 'singleLeaf'"
        v-model="singleLeafValue"
        selectable
        only-radio-leaf
        check-on-click-node
        default-expand-all
        theme-color="#299764"
        :data="demoTreeData"></uni-tree-view>
      <uni-tree-view
        v-else-if="mode === 'multiple'"
        ref="treeRef"
        v-model="multipleValue"
        selectable
        multiple
        check-on-click-node
        default-expand-all
        theme-color="#299764"
        :data="demoTreeData"></uni-tree-view>
      <uni-tree-view
        v-else
        ref="treeRef"
        v-model="strictValue"
        selectable
        multiple
        check-strictly
        check-on-click-node
        default-expand-all
        theme-color="#299764"
        :data="demoTreeData"></uni-tree-view>
    </view>

    <view class="docs-demo-status">
      <view class="docs-demo-status__icon"></view>
      <view class="docs-demo-status__content">
        <text class="docs-demo-status__title">{{ selectionTitle }}</text>
        <view v-if="selectedLabels.length" class="docs-demo-result-tags">
          <text v-for="label in selectedLabels.slice(0, 4)" :key="label" class="docs-demo-result-tag">
            {{ label }}
          </text>
        </view>
        <text v-else class="docs-demo-status__detail">点击节点或选择框体验当前策略</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import UniTreeView from "uni-tree-view";
import type { UniTreeViewExposed } from "uni-tree-view";
import { computed, shallowRef } from "vue";
import type { DemoTreeKey, DemoTreeNode } from "./data";
import { demoTreeData } from "./data";

type SelectionMode = "single" | "singleLeaf" | "multiple" | "strict";

const modes = [
  { key: "single", label: "单选" },
  { key: "singleLeaf", label: "叶子单选" },
  { key: "multiple", label: "父子联动" },
  { key: "strict", label: "严格模式" }
] as const;

const mode = shallowRef<SelectionMode>("multiple");
const treeRef = shallowRef<UniTreeViewExposed | null>(null);
const singleValue = shallowRef<DemoTreeKey | null>("frontend");
const singleLeafValue = shallowRef<DemoTreeKey | null>("frontend-1");
const multipleValue = shallowRef<DemoTreeKey[]>(["design-1"]);
const strictValue = shallowRef<DemoTreeKey[]>(["backend"]);
const isMultipleMode = computed(() => mode.value === "multiple" || mode.value === "strict");

function checkDesignTeam() {
  treeRef.value?.setCheckedKeys("design", true);
}

function clearChecked() {
  if (!treeRef.value) {
    return;
  }

  const selectableKeys = treeRef.value.getCheckedNodes()
    .filter((node) => !node.disabled)
    .map((node) => node.id);
  treeRef.value.setCheckedKeys(selectableKeys, false);
}

function findLabel(nodes: DemoTreeNode[], key: DemoTreeKey): string | undefined {
  for (const node of nodes) {
    if (node.id === key) {
      return node.label;
    }
    if (node.children) {
      const label = findLabel(node.children, key);
      if (label) {
        return label;
      }
    }
  }
  return undefined;
}

const selectedKeys = computed<DemoTreeKey[]>(() => {
  if (mode.value === "single") {
    return singleValue.value === null ? [] : [singleValue.value];
  }
  if (mode.value === "singleLeaf") {
    return singleLeafValue.value === null ? [] : [singleLeafValue.value];
  }
  return mode.value === "strict" ? strictValue.value : multipleValue.value;
});
const selectedLabels = computed(() => selectedKeys.value.map((key) => findLabel(demoTreeData, key)));
const selectionTitle = computed(() => {
  if (mode.value === "single" || mode.value === "singleLeaf") {
    return selectedLabels.value[0] ? `当前选择：${selectedLabels.value[0]}` : "尚未选择";
  }
  return selectedKeys.value.length ? `已选择 ${selectedKeys.value.length} 个节点` : "尚未选择";
});
const modeDescription = computed(() => ({
  single: "任意节点可单选，父子互不影响",
  singleLeaf: "仅叶子节点参与单选",
  multiple: "父子节点自动联动并展示半选",
  strict: "每个节点都可独立选择"
})[mode.value]);
</script>

<style lang="scss">
@use "./demo.scss";
</style>