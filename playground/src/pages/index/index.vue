<template>
  <app-page>
    <view class="page">
      <view class="page__hero">
        <view class="page__hero-text">
          <text class="page__title">
            Uni Tree View
          </text>
          <text class="page__subtitle">
            轻量、独立的跨端树形选择组件
          </text>
        </view>
        <wd-tag type="primary" variant="plain" round>
          v{{ version }}
        </wd-tag>
      </view>

      <wd-search
        v-model="filterValue"
        placeholder="搜索节点"
        hide-cancel
        placeholder-left></wd-search>

      <view class="page__card">
        <view class="page__card-header">
          <text class="page__card-title">
            基础多选
          </text>
          <wd-tag v-if="checkedValue.length" type="primary" variant="plain">
            已选 {{ checkedValue.length }}
          </wd-tag>
        </view>
        <uni-tree-view
          v-model="checkedValue"
          show-checkbox
          multiple
          check-on-click-node
          expand-on-click-node
          theme-color="#299764"
          :data="treeData"
          :filter-value="filterValue"
          :default-expanded-keys="['building-a']"
          expand-checked
          :tree-props="treeProps"
          @change="handleChange"
          @expand-change="handleExpandChange"></uni-tree-view>
      </view>

      <wd-cell-group border custom-class="page__cells">
        <wd-cell title="当前选中" :value="checkedText"></wd-cell>
        <wd-cell title="最近事件" :value="latestAction"></wd-cell>
        <wd-cell
          title="更多示例"
          value="懒加载 / 插槽 / 弹窗选择"
          is-link
          clickable
          @click="goExamples"></wd-cell>
      </wd-cell-group>

      <view class="page__card">
        <view class="page__card-header">
          <view class="page__card-header-main">
            <text class="page__card-title">
              大数据虚拟渲染
            </text>
            <text class="page__card-desc">
              {{ largeTreeSummary }}
            </text>
          </view>
          <wd-button
            size="small"
            type="primary"
            :variant="showLargeTree ? 'plain' : 'base'"
            @click="toggleLargeTree">
            {{ showLargeTree ? "关闭" : "开启" }}
          </wd-button>
        </view>

        <view v-if="showLargeTree" class="page__large-tree">
          <uni-tree-view
            v-model="largeCheckedValue"
            show-checkbox
            multiple
            check-on-click-node
            expand-on-click-node
            virtual
            default-expand-all
            theme-color="#299764"
            :virtual-height="560"
            :virtual-item-height="36"
            :virtual-overscan="12"
            :data="largeTreeData"
            :tree-props="treeProps"
            @change="handleLargeChange"
            @expand-change="handleLargeExpandChange"></uni-tree-view>
        </view>
      </view>

      <wd-gap height="48rpx" bg-color="transparent"></wd-gap>
    </view>
  </app-page>
</template>

<script setup lang='ts'>
import UniTreeView from "uni-tree-view";
import { computed, shallowRef } from "vue";
import AppPage from "@/components/appPage/index.vue";

interface DemoTreeNode {
  id: string;
  label: string;
  children?: DemoTreeNode[];
}

const version = __UNI_TREE_VIEW_VERSION__;
const filterValue = shallowRef("");
const checkedValue = shallowRef<Array<string | number>>(["floor-a-2"]);
const latestAction = shallowRef("等待操作");
const showLargeTree = shallowRef(false);
const largeTreeData = shallowRef<DemoTreeNode[]>([]);
const largeCheckedValue = shallowRef<Array<string | number>>([]);
const largeNodeCount = shallowRef(0);
const largeLatestAction = shallowRef("未开启");

const treeProps = {
  id: "id",
  label: "label",
  children: "children",
  disabled: "disabled"
};

const treeData = [
  {
    id: "building-a",
    label: "A 栋",
    children: [
      {
        id: "floor-a-1",
        label: "1 层",
        children: [
          { id: "room-a-101", label: "101 会议室" },
          { id: "room-a-102", label: "102 办公区" }
        ]
      },
      {
        id: "floor-a-2",
        label: "2 层",
        children: [
          { id: "room-a-201", label: "201 展厅" },
          { id: "room-a-202", label: "202 设备间", disabled: true }
        ]
      }
    ]
  },
  {
    id: "building-b",
    label: "B 栋",
    children: [
      { id: "floor-b-1", label: "1 层" },
      { id: "floor-b-2", label: "2 层" }
    ]
  }
];

const checkedText = computed(() => {
  return checkedValue.value.join(", ") || "暂无";
});

const largeTreeSummary = computed(() => {
  if (!showLargeTree.value) {
    return "点击开启 5000+ 节点性能演示";
  }

  return `${largeNodeCount.value} 个节点 / 6 级 · ${largeLatestAction.value}`;
});

function handleChange(payload: any) {
  latestAction.value = `change: ${payload.keys.join(", ") || "none"}`;
}

function goExamples() {
  uni.navigateTo({ url: "/pages/examples/index" });
}

function handleExpandChange(payload: any) {
  latestAction.value = `${payload.expanded ? "expand" : "collapse"}: ${payload.node.id}`;
}

function toggleLargeTree() {
  if (showLargeTree.value) {
    showLargeTree.value = false;
    largeTreeData.value = [];
    largeCheckedValue.value = [];
    largeNodeCount.value = 0;
    largeLatestAction.value = "已关闭";
    return;
  }

  const { data, count } = createLargeTreeData();
  largeTreeData.value = data;
  largeNodeCount.value = count;
  largeLatestAction.value = "已生成";
  showLargeTree.value = true;
}

function handleLargeChange(payload: any) {
  largeLatestAction.value = `选中 ${payload.keys.length} 项`;
}

function handleLargeExpandChange(payload: any) {
  largeLatestAction.value = `${payload.expanded ? "展开" : "收起"} ${payload.node.id}`;
}

function createLargeTreeData() {
  const levelSizes = [7, 7, 5, 4, 3, 2];
  const levelNames = ["省", "市", "区县", "镇街", "社区", "网格"];
  let count = 0;

  function createLevel(level: number, parentKey: string): DemoTreeNode[] {
    return Array.from({ length: levelSizes[level] }, (_, index) => {
      const key = parentKey ? `${parentKey}-${index + 1}` : `${index + 1}`;
      count += 1;

      const node: DemoTreeNode = {
        id: `area-${key}`,
        label: `${levelNames[level]} ${key}`
      };

      if (level < levelSizes.length - 1) {
        node.children = createLevel(level + 1, key);
      }

      return node;
    });
  }

  return {
    data: createLevel(0, ""),
    count
  };
}
</script>

<style scoped lang='scss'>
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 0;
  background: var(--wot-filled-bottom, #f6f7fb);
}

.page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24rpx 8rpx 32rpx;
}

.page__title,
.page__subtitle {
  display: block;
}

.page__title {
  color: var(--wot-text-main, #111827);
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.page__subtitle {
  margin-top: 12rpx;
  color: var(--wot-text-auxiliary, #667085);
  font-size: 26rpx;
}

.page__card {
  margin-top: 24rpx;
  padding: 24rpx;
  background: var(--wot-filled-oppo, #ffffff);
  border-radius: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(16, 24, 40, 0.04);
}

.page__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.page__card-header-main {
  flex: 1;
  min-width: 0;
}

.page__card-title {
  display: block;
  color: var(--wot-text-main, #111827);
  font-size: 30rpx;
  font-weight: 600;
}

.page__card-desc {
  display: block;
  margin-top: 8rpx;
  color: var(--wot-text-auxiliary, #667085);
  font-size: 24rpx;
}

.page__large-tree {
  height: 560px;
  margin-top: 16rpx;
  overflow: hidden;
  border: 1rpx solid var(--wot-border-light, #e4e7ec);
  border-radius: 16rpx;
}

// wd-cell-group 外层圆角
:deep(.page__cells) {
  margin-top: 24rpx;
  overflow: hidden;
  border-radius: 24rpx;
}
</style>