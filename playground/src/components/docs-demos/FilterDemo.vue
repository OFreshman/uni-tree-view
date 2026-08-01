<template>
  <view class="docs-demo-stack">
    <view class="docs-demo-section-label">
      <text>实时搜索</text>
      <text class="docs-demo-section-label__value">保留祖先路径</text>
    </view>

    <wd-search
      v-model="keyword"
      custom-class="docs-demo-search"
      placeholder="搜索部门或成员"
      hide-cancel
      placeholder-left></wd-search>

    <view class="docs-demo-toolbar">
      <button
        v-for="item in quickKeywords"
        :key="item"
        class="docs-demo-chip"
        :class="{ 'is-active': keyword === item }"
        @click="applyKeyword(item)">
        {{ item }}
      </button>
    </view>

    <view class="docs-demo-card">
      <view class="docs-demo-card__header">
        <text class="docs-demo-card__title">搜索结果</text>
        <view class="docs-demo-card__meta">
          <view class="docs-demo-card__meta-dot"></view>
          实时更新
        </view>
      </view>
      <uni-tree-view
        :data="demoTreeData"
        :filter-value="keyword"
        default-expand-all
        highlight-filter
        show-path
        theme-color="#299764"
        @filter-change="resultCount = $event.keys.length">
        <template #empty="{ filterValue }">
          <view class="docs-demo-empty">
            没有找到“{{ filterValue }}”
          </view>
        </template>
      </uni-tree-view>
    </view>

    <view class="docs-demo-status">
      <view class="docs-demo-status__icon"></view>
      <view class="docs-demo-status__content">
        <text class="docs-demo-status__title">{{ resultTitle }}</text>
        <text class="docs-demo-status__detail">{{ resultDetail }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import UniTreeView from "uni-tree-view";
import { computed, shallowRef } from "vue";
import { demoTreeData } from "./data";

const quickKeywords = ["前端", "设计", "顾宁"];
const keyword = shallowRef("");
const resultCount = shallowRef(0);
const resultTitle = computed(() => {
  if (!keyword.value) {
    return "当前展示全部节点";
  }
  return resultCount.value ? `找到 ${resultCount.value} 个相关节点` : "没有匹配的节点";
});
const resultDetail = computed(() => {
  if (!keyword.value) {
    return "输入部门或成员名称，祖先节点会自动保留";
  }
  if (!resultCount.value) {
    return "没有节点命中该关键词，可试试「前端」「设计」或「顾宁」";
  }
  return `关键词「${keyword.value}」已在命中节点中高亮显示`;
});

function applyKeyword(value: string) {
  keyword.value = keyword.value === value ? "" : value;
}
</script>

<style lang="scss">
@use "./demo.scss";
</style>