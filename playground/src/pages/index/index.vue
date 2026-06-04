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
      show-checkbox
      :data="treeData"
      :default-checked-keys="['floor-a-2']"
      :tree-props="treeProps"></uni-tree-view>
  </view>
</template>

<script setup lang='ts'>
import UniTreeView from "uni-tree-view";

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
</style>