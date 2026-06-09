<template>
  <view
    class="uni-tree-view-container"
    :style="{ '--theme-color': props.themeColor }">
    <scroll-view class="scroll-view-container" :scroll-y="true">
      <view v-if="visibleTreeList.length === 0" class="utv-tree-empty">
        {{ props.emptyText }}
      </view>
      <view
        v-for="node in visibleTreeList"
        :key="node.id"
        :style="[{
          paddingLeft: `${node.level * props.indent}rpx`
        }]"
        class="utv-tree-item"
        :class="{
          'is-leaf': node.isLeaf,
          'is-expanded': node.expanded,
          'is-disabled': node.disabled
        }">
        <view
          v-if="!node.isLeaf && hasChildren(node.id)"
          class="utv-tree-item__arrow--icon is-right"
          :class="{ 'is-expand': node.expanded }"
          @click.stop="handleToggleExpand(node)"></view>
        <view v-else class="utv-tree-item__arrow--placeholder"></view>

        <view
          v-if="showSelectionControl && props.checkboxPlacement === 'left'"
          class="utv-tree-item__checkbox"
          :class="{ 'is--disabled': node.disabled }"
          @click.stop="handleCheckChange(node)">
          <view
            class="utv-tree-item__checkbox--icon"
            :class="getSelectionIconClass(node)"></view>
        </view>

        <view class="utv-tree-node-label">
          {{ node.label }}
        </view>

        <view
          v-if="showSelectionControl && props.checkboxPlacement === 'right'"
          class="utv-tree-item__checkbox"
          :class="{ 'is--disabled': node.disabled }"
          @click.stop="handleCheckChange(node)">
          <view
            class="utv-tree-item__checkbox--icon"
            :class="getSelectionIconClass(node)"></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { DefaultTreeProps } from "./constants";
import type {
  TreeChangePayload,
  TreeKey,
  TreeNode,
  UniTreeListEmits,
  UniTreeListProps
} from "./types";
import { useTreeViewState } from "./useTreeViewState";

defineOptions({
  name: "UniTreeList",
  options: {
    // #ifdef MP-WEIXIN || MP-ALIPAY
    virtualHost: true
    // #endif
  }
});

const props = withDefaults(defineProps<UniTreeListProps>(), {
  modelValue: undefined,
  data: () => [],
  treeProps: () => DefaultTreeProps,
  themeColor: "#007aff",
  showCheckbox: false,
  showRadioIcon: true,
  multiple: false,
  checkStrictly: false,
  onlyRadioLeaf: false,
  defaultExpandAll: false,
  defaultExpandedKeys: () => [],
  defaultExpandedIds: () => [],
  expandChecked: false,
  defaultCheckedKeys: () => [],
  indent: 40,
  checkboxPlacement: "left",
  emptyText: "暂无数据"
});

const emit = defineEmits<UniTreeListEmits>();

const {
  isMultiple,
  visibleTreeList,
  toggleExpand,
  checkNode,
  hasChildren,
  getSelectionIconClass,
  setCheckedKeys: setStateCheckedKeys,
  getCheckedKeys,
  getHalfCheckedKeys,
  getUncheckedKeys,
  getCheckedNodes,
  getHalfCheckedNodes,
  getUncheckedNodes,
  setExpandedKeys,
  getExpandedKeys,
  getUnexpandedKeys,
  getExpandedNodes,
  getUnexpandedNodes,
  expandAll,
  collapseAll
} = useTreeViewState(props);

const showSelectionControl = computed(() => {
  return isMultiple.value ? props.showCheckbox || props.multiple : props.showRadioIcon;
});

function handleToggleExpand(node: TreeNode) {
  const payload = toggleExpand(node);
  if (!payload) {
    return;
  }

  emit("goChild", { id: node.id, node });
  emit("expand", payload.expanded, node);
  emit("expand-change", payload);
}

function handleCheckChange(node: TreeNode) {
  const payload = checkNode(node);
  if (!payload) {
    return;
  }

  commitSelectionChange(payload);
}

function commitSelectionChange(payload: TreeChangePayload) {
  emit("update:modelValue", payload.value);
  emit("change", payload);
  emit("checked", payload);
  emit("check-change", payload);
  emit("updated", payload);
}

function setCheckedKeys(keys: TreeKey | TreeKey[], checked = true) {
  const payload = setStateCheckedKeys(keys, checked);
  if (!payload) {
    return;
  }

  commitSelectionChange(payload);
}

defineExpose({
  setCheckedKeys,
  getCheckedKeys,
  getHalfCheckedKeys,
  getUncheckedKeys,
  getCheckedNodes,
  getHalfCheckedNodes,
  getUncheckedNodes,
  setExpandedKeys,
  getExpandedKeys,
  getUnexpandedKeys,
  getExpandedNodes,
  getUnexpandedNodes,
  expandAll,
  collapseAll
});
</script>

<style lang="scss">
@font-face {
  font-family: "uni-tree-iconfont";
  src: url('data:application/octet-stream;base64,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') format('truetype');
}
</style>

<style lang="scss" scoped>
@import "../../style/index.scss";
.uni-tree-view-container {
  width: 100%;
  height: 100%;
}
</style>