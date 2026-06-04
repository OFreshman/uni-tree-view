<template>
  <view class="page">
    <uni-tree-view
      show-checkbox
      :data="treeData"
      :default-checked-keys="[11]"
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
    id: 1,
    label: "默认字段",
    children: [
      { id: 11, label: "单选节点" },
      { id: 12, label: "禁用节点", disabled: true }
    ]
  }
];
</script>

<style scoped lang='scss'>
.page {
  min-height: 100vh;
  padding-top: 24rpx;
  background: #f6f7fb;
}
</style>