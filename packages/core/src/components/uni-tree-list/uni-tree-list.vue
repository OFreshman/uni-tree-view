<template>
  <view class="uni-tree-list-container">
    <scroll-view class="scroll-view-container" scroll-y="true">
      <view
        v-for="node in visibleTreeList"
        :key="node[idKey]"
        :style="[{
          paddingLeft: `${node.level * 16}px`
        }]"
        class="utl-tree-item"
        :class="{
          'visible': node.visible,
          'is-leaf': node.isLeaf,
          'is-expanded': node.expanded
        }"
        @click.stop="handleNodeClick(node)">
        <view
          v-if="!node.isLeaf && hasChildren(node.id)"
          class="utl-tree-item__arrow--icon is-right"
          :class="{ 'is-expand': node.expanded }"
          @click="handleToggleExpand(node)"></view>

        <view
          v-if="props.showCheckbox"
          class="utl-tree-item__checkbox"
          :class="{ 'is--disabled': node.disabled }"
          @click.stop="handleCheckChange(node)">
          <view
            v-if="node.checked === CHECK_STATUS_MAP.checked"
            class="utl-tree-item__checkbox--icon utl-tree-checkbox-checked"></view>
          <view
            v-else-if="node.checked === CHECK_STATUS_MAP.indeterminate"
            class="utl-tree-item__checkbox--icon utl-tree-checkbox-indeterminate"></view>
          <view v-else class="utl-tree-item__checkbox--icon utl-tree-checkbox-outline"></view>
        </view>

        <view class="utl-tree-node-label">
          {{ node.label }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { computed, ref, toRaw, watch } from "vue";
import { CHECK_STATUS_MAP, defaultTreeProps } from "./constants";
import type {
  CheckStatus,
  TreeNode,
  UniTreeListProps
} from "./types";

defineOptions({
  name: "UniTreeList",
  options: {
    // #ifdef MP-WEIXIN || MP-ALIPAY
    virtualHost: true
    // #endif
  }
});

const props = withDefaults(defineProps<UniTreeListProps>(), {
  data: () => [],
  treeProps: () => defaultTreeProps,
  showCheckbox: true, // 节点是否可选
  multiple: true, // TODO（是否支持多选）
  checkStrictly: false, // TODO（是否严格遵循父子不互相关联）
  defaultExpandAll: false, // TODO（展开全部）
  autoExpandParent: false, // TODO（展开子节点的时候是否自动展开父节点）
  defaultCheckedKeys: () => []
});

const treeList = ref<TreeNode[]>([]);
const childrenMap = ref<Map<string | number, TreeNode[]>>(new Map());
const nodeMap = ref<Map<string | number, TreeNode>>(new Map());
const { id: idKey, label: labelKey, children: childrenKey } = props.treeProps;

watch(() => props.data, (newTreeData) => {
  initializeTree(newTreeData);
});

const visibleTreeList = computed(() => {
  return treeList.value.filter((item) => item.visible);
});

initializeTree(toRaw(props.data));

function initializeTree(treeData: TreeNode[] = []) {
  treeList.value = [];
  flattenTree(treeData);
  console.log("flattenTree result", treeList.value, nodeMap.value, childrenMap.value);
  // buildTreeMaps(treeList.value);
  updateNodeAndDescendantsStatus(props.defaultCheckedKeys, CHECK_STATUS_MAP.checked);
  updateParentNodesStatus();
}

// 节点点击
function handleNodeClick(node: TreeNode) {
  if (node.isLeaf) {
    return;
  }
  node.expanded = !node.expanded;

  toggleChildrenExpand(node, node.expanded);
}

// 下拉箭头点击
function handleToggleExpand(node: TreeNode) {
  console.log("handleToggleExpand", node);
}

// 复选框点击
function handleCheckChange(node: TreeNode) {
  if (node.disabled) {
    return;
  }
  const isChecked = node.checked === CHECK_STATUS_MAP.checked;
  const newStatus = isChecked ? CHECK_STATUS_MAP.unchecked : CHECK_STATUS_MAP.checked;
  updateNodeAndDescendantsStatus(node.id, newStatus);
  updateParentNodesStatus();
}

// 扁平树结构，构建nodeMap和childrenMap
function flattenTree(
  list: TreeNode[] = [],
  level = 0,
  parentIds: (string | number)[] = [],
  parents: TreeNode[] = []
) {
  const { defaultCheckedKeys } = props;
  list.forEach((item) => {
    Object.freeze(item);
    const checked =
      (defaultCheckedKeys.includes(item[idKey]) || !!item.check)
        ? CHECK_STATUS_MAP.checked
        : CHECK_STATUS_MAP.unchecked;

    const treeNode: TreeNode = {
      id: item[idKey],
      label: item[labelKey],
      source: item,
      parentIds,
      parents,
      level,
      showChild: false,
      expanded: false,
      visible: level === 0,
      hideArr: [],
      disabled: item.disabled || false,
      checked,
      isLeaf: false
    };
    treeList.value.push(treeNode);

    // 构建Map start
    nodeMap.value.set(item[idKey], treeNode);
    const parentId = parentIds.slice(-1)[0];
    if (parentId !== undefined) {
      if (!childrenMap.value.has(parentId)) {
        childrenMap.value.set(parentId, []);
      }
      childrenMap.value.get(parentId)!.push(treeNode);
    }
    // 构建Map end

    const children = item[childrenKey];
    if (Array.isArray(children) && children.length > 0) {
      const parentIdList: (string | number)[] = [...parentIds, item[idKey]];
      const parentArr: any[] = [...parents, {
        [idKey]: item[idKey],
        [labelKey]: item[labelKey]
      }];
      flattenTree(children, level + 1, parentIdList, parentArr);
    } else {
      treeNode.isLeaf = true;
    }
  });

  // console.log("flattenTree", treeList.value, nodeMap.value, childrenMap.value);
}

// 已被优化至flattenTree, 避免二次遍历构建map
// function buildTreeMaps(flatList: TreeNode[]) {
//   const newChildrenMap = new Map<string | number, TreeNode[]>();
//   const newNodeMap = new Map<string | number, TreeNode>();
//
//   for (const node of flatList) {
//     newNodeMap.set(node.id, node);
//     const parentId = node.parentIds.at(-1);
//     if (parentId !== undefined) {
//       if (!newChildrenMap.has(parentId)) {
//         newChildrenMap.set(parentId, []);
//       }
//       newChildrenMap.get(parentId)!.push(node);
//     }
//   }
//   childrenMap.value = newChildrenMap;
//   nodeMap.value = newNodeMap;
//
//   console.log("map: ", childrenMap.value, nodeMap.value);
// }

function toggleChildrenExpand(node: TreeNode, expand: boolean) {
  const children = childrenMap.value.get(node.id);
  if (!children || children.length === 0) {
    return;
  }
  if (expand) {
    for (const child of children) {
      // child.expanded = expand;
      child.visible = true;
    }
  } else { // 是否收起全部子节点
    for (const child of children) {
      child.expanded = expand;
      child.visible = false;
      const childrenOfChild = childrenMap.value.get(child.id);
      if (childrenOfChild && childrenOfChild.length > 0) {
        toggleChildrenExpand(child, expand);
      }
    }
  }
}

function updateNodeAndDescendantsStatus(
  targetIds: string | number | (string | number)[],
  newStatus: Exclude<CheckStatus, "indeterminate"> // 不允许直接给子节点设半选
) {
  const ids = Array.isArray(targetIds) ? targetIds : [targetIds];

  for (const targetId of ids) {
    const node = nodeMap.value.get(targetId);
    if (node) {
      node.checked = newStatus;
      const children = childrenMap.value.get(targetId);
      if (children && children.length > 0) {
        const childIds = children.map((child) => child.id);
        updateNodeAndDescendantsStatus(childIds, newStatus);
      }
    }
  }
}


function hasChildren(nodeId: string | number) {
  const children = childrenMap.value.get(nodeId);
  return Array.isArray(children) && children.length > 0;
}

function updateParentNodesStatus() {
  const reversed = [...treeList.value].reverse();
  for (const node of reversed) {
    const children = childrenMap.value.get(node.id);
    if (!children?.length) {
      continue;
    }

    const allChecked = children.every((c) => c.checked === CHECK_STATUS_MAP.checked);
    const allUnchecked = children.every((c) => c.checked === CHECK_STATUS_MAP.unchecked);

    if (allChecked) {
      node.checked = CHECK_STATUS_MAP.checked;
    } else if (allUnchecked) {
      node.checked = CHECK_STATUS_MAP.unchecked;
    } else {
      node.checked = CHECK_STATUS_MAP.indeterminate;
    }
  }
}
</script>

<style lang="scss">
@font-face {
  font-family: "uni-tree-iconfont";
  src: url('data:application/octet-stream;base64,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') format('truetype');
}
</style>

<style lang="scss" scoped>
.uni-tree-list-container {
  width: 100%;
  height: 100%;
}

.utl-tree-item {
  display: flex;
  align-items: center;

  &__arrow--icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32rpx;
    height: 32rpx;
    &::after {
      position: relative;
      z-index: 1;
      overflow: hidden;
      /* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
      font-family: "uni-tree-iconfont" !important;
      font-size: 32rpx;
      font-style: normal;
      color: #999999;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    &.is-right::after {
      content: '\e604';
      transform: rotate(-90deg);
    }

    &.is-expand::after {
      transform: rotate(0deg);
    }

    &.is-loading {
      animation: IconLoading 1s linear 0s infinite;

      &::after {
        content: '\e7f1';
      }
    }
  }

  &__checkbox {
    width: 40rpx;
    height: 40rpx;
    overflow: hidden;

    &--icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40rpx;
      height: 40rpx;

      &::after {
        position: relative;
        top: 0;
        left: 0;
        z-index: 1;
        overflow: hidden;
        /* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
        font-family: "uni-tree-iconfont" !important;
        font-size: 32rpx;
        font-style: normal;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      &.utl-tree-checkbox-outline::after {
        color: #bbb;
        content: "\ead5";
      }

      &.utl-tree-checkbox-checked::after {
        color: var(--theme-color,#007aff);
        content: "\ead4";
      }

      &.utl-tree-checkbox-indeterminate::after {
        color: var(--theme-color,#007aff);
        content: "\ebce";
      }

      &.utl-tree-radio-outline::after {
        color: #bbb;
        content: "\ecc5";
      }

      &.utl-tree-radio-checked::after {
        color: var(--theme-color,#007aff);
        content: "\ecc4";
      }

      &.utl-tree-radio-indeterminate::after {
        color: var(--theme-color,#007aff);
        content: "\ea4f";
      }
    }
  }
}
</style>