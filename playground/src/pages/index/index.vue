<template>
  <view class="page">
    <view class="page__header">
      <text class="page__title">
        Uni Tree View
      </text>
      <text class="page__subtitle">
        树形列表选择示例
      </text>
    </view>

    <uni-tree-view
      v-model="checkedValue"
      show-checkbox
      :data="treeData"
      :default-expanded-keys="['building-a']"
      expand-checked
      :tree-props="treeProps"
      @change="handleChange"
      @expand-change="handleExpandChange"></uni-tree-view>

    <view class="page__panel">
      <text class="page__panel-title">
        当前选中
      </text>
      <text class="page__panel-value">
        {{ checkedValue.join(", ") || "暂无" }}
      </text>
      <text class="page__panel-title page__panel-title--gap">
        最近事件
      </text>
      <text class="page__panel-value">
        {{ latestAction }}
      </text>
    </view>

    <view class="page__panel page__panel--perf">
      <view class="page__panel-row">
        <view>
          <text class="page__panel-title">
            大数据测试
          </text>
          <text class="page__panel-value">
            {{ largeTreeSummary }}
          </text>
        </view>
        <button
          class="page__button"
          size="mini"
          @click="toggleLargeTree">
          {{ showLargeTree ? "关闭" : "打开" }}
        </button>
      </view>

      <uni-tree-view
        v-if="showLargeTree"
        v-model="largeCheckedValue"
        class="page__large-tree"
        show-checkbox
        virtual
        default-expand-all
        :virtual-height="560"
        :virtual-item-height="36"
        :virtual-overscan="12"
        :data="largeTreeData"
        :tree-props="treeProps"
        @change="handleLargeChange"
        @expand-change="handleLargeExpandChange"></uni-tree-view>
    </view>
  </view>
</template>

<script setup lang='ts'>
import UniTreeView from "uni-tree-view";
import { computed, shallowRef } from "vue";

interface DemoTreeNode {
  id: string;
  label: string;
  children?: DemoTreeNode[];
}

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

const largeTreeSummary = computed(() => {
  if (!showLargeTree.value) {
    return "未挂载";
  }

  return `${largeNodeCount.value} 个节点，最多 6 级，${largeLatestAction.value}`;
});

function handleChange(payload: any) {
  latestAction.value = `change: ${payload.keys.join(", ") || "none"}`;
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
  background: #f6f7fb;
}

.page__header {
  padding: 40rpx 32rpx 28rpx;
}

.page__title,
.page__subtitle {
  display: block;
}

.page__title {
  color: #111827;
  font-size: 40rpx;
  font-weight: 700;
}

.page__subtitle {
  margin-top: 12rpx;
  color: #667085;
  font-size: 26rpx;
}

.page__panel {
  margin: 32rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 8rpx;
}

.page__panel--perf {
  margin-bottom: 48rpx;
}

.page__panel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.page__panel-title,
.page__panel-value {
  display: block;
}

.page__panel-title {
  color: #667085;
  font-size: 24rpx;
}

.page__panel-title--gap {
  margin-top: 20rpx;
}

.page__panel-value {
  margin-top: 8rpx;
  color: #111827;
  font-size: 28rpx;
}

.page__button {
  flex: 0 0 auto;
  margin: 0;
  color: #ffffff;
  background: #111827;
  border-radius: 8rpx;
}

.page__large-tree {
  height: 560px;
  margin-top: 24rpx;
  overflow: hidden;
  background: #ffffff;
  border: 1rpx solid #e4e7ec;
  border-radius: 8rpx;
}
</style>