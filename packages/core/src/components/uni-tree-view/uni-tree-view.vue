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
import { computed, ref, toRaw, watch } from "vue";
import { CHECK_STATUS_MAP, DefaultTreeProps } from "./constants";
import type {
  CheckStatus,
  TreeChangePayload,
  TreeDataItem,
  TreeKey,
  TreeNode,
  TreeProps,
  UniTreeListEmits,
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

const treeList = ref<TreeNode[]>([]);
const childrenMap = ref<Map<string | number, TreeNode[]>>(new Map());
const nodeMap = ref<Map<string | number, TreeNode>>(new Map());

const resolvedTreeProps = computed<TreeProps>(() => ({
  ...DefaultTreeProps,
  ...props.treeProps
}));

const isMultiple = computed(() => props.multiple || props.showCheckbox);

const showSelectionControl = computed(() => {
  return isMultiple.value ? props.showCheckbox || props.multiple : props.showRadioIcon;
});

const visibleTreeList = computed(() => {
  return treeList.value.filter((item) => item.visible);
});

watch(
  () => [
    props.data,
    getTreePropsSignature()
  ] as const,
  () => {
    initializeTree(toRaw(props.data));
  },
  {
    immediate: true
  }
);

watch(
  () => getExpansionConfigSignature(),
  () => {
    applyExpandedState();
  }
);

watch(
  () => getCheckedConfigSignature(),
  () => {
    applyCheckedState(getInitialCheckedKeys());
  }
);

function initializeTree(treeData: TreeDataItem[] = []) {
  treeList.value = [];
  childrenMap.value = new Map();
  nodeMap.value = new Map();
  flattenTree(treeData);
  applyCheckedState(getInitialCheckedKeys());
  applyExpandedState();
}

function handleToggleExpand(node: TreeNode) {
  if (node.isLeaf) {
    return;
  }

  node.expanded = !node.expanded;
  updateVisibility();
  emit("goChild", { id: node.id, node });
  emit("expand", node.expanded, node);
  emit("expand-change", {
    expanded: node.expanded,
    node
  });
}

function handleCheckChange(node: TreeNode) {
  if (!canSelectNode(node)) {
    return;
  }

  if (isMultiple.value) {
    const newStatus = node.checked === CHECK_STATUS_MAP.checked
      ? CHECK_STATUS_MAP.unchecked
      : CHECK_STATUS_MAP.checked;
    if (props.checkStrictly) {
      node.checked = newStatus;
    } else {
      updateNodeAndDescendantsStatus(node.id, newStatus);
      updateParentNodesStatus();
    }
  } else {
    const newStatus = node.checked === CHECK_STATUS_MAP.checked
      ? CHECK_STATUS_MAP.unchecked
      : CHECK_STATUS_MAP.checked;
    clearCheckedStatus();
    if (newStatus === CHECK_STATUS_MAP.checked) {
      node.checked = CHECK_STATUS_MAP.checked;
    }
  }

  commitSelectionChange(node);
}

function flattenTree(
  list: TreeDataItem[] = [],
  level = 0,
  parentIds: TreeKey[] = [],
  parents: TreeDataItem[] = []
) {
  const { id: idKey, label: labelKey, children: childrenKey, disabled: disabledKey = "disabled" } = resolvedTreeProps.value;
  list.forEach((item) => {
    const id = item[idKey] as TreeKey;
    const children = item[childrenKey];

    const treeNode: TreeNode = {
      id,
      label: String(item[labelKey] ?? ""),
      source: item,
      parentId: parentIds[parentIds.length - 1],
      parentIds,
      parents,
      level,
      expanded: false,
      visible: level === 0,
      disabled: Boolean(item[disabledKey]),
      checked: CHECK_STATUS_MAP.unchecked,
      isLeaf: !(Array.isArray(children) && children.length > 0)
    };
    treeList.value.push(treeNode);

    nodeMap.value.set(id, treeNode);
    const parentId = parentIds.slice(-1)[0];
    if (parentId !== undefined) {
      if (!childrenMap.value.has(parentId)) {
        childrenMap.value.set(parentId, []);
      }
      childrenMap.value.get(parentId)!.push(treeNode);
    }

    if (Array.isArray(children) && children.length > 0) {
      const parentIdList: TreeKey[] = [...parentIds, id];
      const parentArr: TreeDataItem[] = [...parents, item];
      flattenTree(children, level + 1, parentIdList, parentArr);
    }
  });
}

function applyCheckedState(keys: TreeKey[]) {
  clearCheckedStatus();
  if (keys.length === 0) {
    return;
  }

  if (isMultiple.value) {
    if (props.checkStrictly) {
      for (const key of keys) {
        const node = nodeMap.value.get(key);
        if (node) {
          node.checked = CHECK_STATUS_MAP.checked;
        }
      }
      return;
    }

    updateNodeAndDescendantsStatus(keys, CHECK_STATUS_MAP.checked, true);
    updateParentNodesStatus();
    return;
  }

  const firstSelectableKey = keys.find((key) => {
    const node = nodeMap.value.get(key);
    return node && (!props.onlyRadioLeaf || node.isLeaf);
  });
  if (firstSelectableKey !== undefined) {
    const node = nodeMap.value.get(firstSelectableKey);
    if (node) {
      node.checked = CHECK_STATUS_MAP.checked;
    }
  }
}

function applyExpandedState() {
  const defaultExpandedKeys = normalizeKeys(props.defaultExpandedKeys);
  const defaultExpandedIds = normalizeKeys(props.defaultExpandedIds);
  const expandedKeySet = new Set<TreeKey>([
    ...defaultExpandedKeys,
    ...defaultExpandedIds
  ]);

  for (const node of treeList.value) {
    node.expanded = props.defaultExpandAll || expandedKeySet.has(node.id);
  }

  applyExpandCheckedState();

  updateVisibility();
}

function applyExpandCheckedState() {
  if (!props.expandChecked) {
    return;
  }

  for (const node of getCheckedNodes()) {
    for (const parentId of node.parentIds) {
      const parent = nodeMap.value.get(parentId);
      if (parent) {
        parent.expanded = true;
      }
    }
  }

  updateVisibility();
}

function updateNodeAndDescendantsStatus(
  targetIds: TreeKey | TreeKey[],
  newStatus: Exclude<CheckStatus, "indeterminate">,
  includeDisabled = false
) {
  const ids = Array.isArray(targetIds) ? targetIds : [targetIds];

  for (const targetId of ids) {
    const node = nodeMap.value.get(targetId);
    if (!node || (node.disabled && !includeDisabled)) {
      continue;
    }

    node.checked = newStatus;
    const children = childrenMap.value.get(targetId);
    if (children && children.length > 0) {
      const childIds = children.map((child) => child.id);
      updateNodeAndDescendantsStatus(childIds, newStatus, includeDisabled);
    }
  }
}

function hasChildren(nodeId: TreeKey) {
  const children = childrenMap.value.get(nodeId);
  return Array.isArray(children) && children.length > 0;
}

function updateParentNodesStatus() {
  if (props.checkStrictly || !isMultiple.value) {
    return;
  }

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

function updateVisibility() {
  for (const node of treeList.value) {
    node.visible = node.level === 0 || node.parentIds.every((parentId) => {
      return nodeMap.value.get(parentId)?.expanded;
    });
  }
}

function canSelectNode(node: TreeNode) {
  if (node.disabled) {
    return false;
  }

  if (!isMultiple.value && props.onlyRadioLeaf && !node.isLeaf) {
    return false;
  }

  return true;
}

function clearCheckedStatus() {
  for (const node of treeList.value) {
    node.checked = CHECK_STATUS_MAP.unchecked;
  }
}

function normalizeKeys(value: TreeKey | TreeKey[] | null | undefined): TreeKey[] {
  if (value === null || value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getTreePropsSignature() {
  return JSON.stringify(resolvedTreeProps.value);
}

function getExpansionConfigSignature() {
  return JSON.stringify({
    defaultExpandAll: props.defaultExpandAll,
    defaultExpandedKeys: normalizeKeys(props.defaultExpandedKeys),
    defaultExpandedIds: normalizeKeys(props.defaultExpandedIds),
    expandChecked: props.expandChecked
  });
}

function getCheckedConfigSignature() {
  return JSON.stringify({
    modelValue: props.modelValue,
    defaultCheckedKeys: props.defaultCheckedKeys,
    multiple: props.multiple,
    showCheckbox: props.showCheckbox,
    checkStrictly: props.checkStrictly,
    onlyRadioLeaf: props.onlyRadioLeaf
  });
}

function getInitialCheckedKeys() {
  if (props.modelValue !== undefined) {
    return normalizeKeys(props.modelValue);
  }

  return normalizeKeys(props.defaultCheckedKeys);
}

function getSelectionIconClass(node: TreeNode) {
  if (isMultiple.value) {
    if (node.checked === CHECK_STATUS_MAP.checked) {
      return "utv-tree-checkbox-checked";
    }
    if (node.checked === CHECK_STATUS_MAP.indeterminate) {
      return "utv-tree-checkbox-indeterminate";
    }
    return "utv-tree-checkbox-outline";
  }

  if (node.checked === CHECK_STATUS_MAP.checked) {
    return "utv-tree-radio-checked";
  }

  return "utv-tree-radio-outline";
}

function getCheckedKeys() {
  return getCheckedNodes().map((node) => node.id);
}

function getHalfCheckedKeys() {
  return getHalfCheckedNodes().map((node) => node.id);
}

function getUncheckedKeys() {
  return getUncheckedNodes().map((node) => node.id);
}

function getCheckedNodes() {
  return treeList.value.filter((node) => node.checked === CHECK_STATUS_MAP.checked);
}

function getHalfCheckedNodes() {
  return treeList.value.filter((node) => node.checked === CHECK_STATUS_MAP.indeterminate);
}

function getUncheckedNodes() {
  return treeList.value.filter((node) => node.checked === CHECK_STATUS_MAP.unchecked);
}

function getExpandedKeys() {
  return getExpandedNodes().map((node) => node.id);
}

function getUnexpandedKeys() {
  return getUnexpandedNodes().map((node) => node.id);
}

function getExpandedNodes() {
  return treeList.value.filter((node) => !node.isLeaf && node.expanded);
}

function getUnexpandedNodes() {
  return treeList.value.filter((node) => !node.isLeaf && !node.expanded);
}

function getModelValue() {
  if (isMultiple.value) {
    return getCheckedKeys();
  }

  return getCheckedKeys()[0] ?? null;
}

function buildChangePayload(node: TreeNode): TreeChangePayload {
  return {
    value: getModelValue(),
    keys: getCheckedKeys(),
    nodes: getCheckedNodes(),
    node
  };
}

function commitSelectionChange(node: TreeNode) {
  const payload = buildChangePayload(node);
  emit("update:modelValue", payload.value);
  emit("change", payload);
  emit("checked", payload);
  emit("check-change", payload);
  emit("updated", payload);
}

function setCheckedKeys(keys: TreeKey | TreeKey[], checked = true) {
  const normalizedKeys = normalizeKeys(keys);
  const changedNode = normalizedKeys
    .map((key) => nodeMap.value.get(key))
    .find((node): node is TreeNode => Boolean(node));
  if (!changedNode) {
    return;
  }

  if (!checked) {
    if (isMultiple.value) {
      if (props.checkStrictly) {
        for (const key of normalizedKeys) {
          const node = nodeMap.value.get(key);
          if (node) {
            node.checked = CHECK_STATUS_MAP.unchecked;
          }
        }
      } else {
        updateNodeAndDescendantsStatus(normalizedKeys, CHECK_STATUS_MAP.unchecked, true);
        updateParentNodesStatus();
      }
    } else {
      for (const key of normalizedKeys) {
        const node = nodeMap.value.get(key);
        if (node) {
          node.checked = CHECK_STATUS_MAP.unchecked;
        }
      }
    }
    commitSelectionChange(changedNode);
    return;
  }

  if (isMultiple.value) {
    if (props.checkStrictly) {
      for (const key of normalizedKeys) {
        const node = nodeMap.value.get(key);
        if (node) {
          node.checked = CHECK_STATUS_MAP.checked;
        }
      }
    } else {
      updateNodeAndDescendantsStatus(normalizedKeys, CHECK_STATUS_MAP.checked, true);
      updateParentNodesStatus();
    }
  } else {
    clearCheckedStatus();
    changedNode.checked = CHECK_STATUS_MAP.checked;
  }

  commitSelectionChange(changedNode);
}

function setExpandedKeys(keys: TreeKey[] | "all", expanded = true) {
  if (keys === "all") {
    for (const node of treeList.value) {
      if (!node.isLeaf) {
        node.expanded = expanded;
      }
    }
    updateVisibility();
    return;
  }

  for (const key of keys) {
    const node = nodeMap.value.get(key);
    if (node && !node.isLeaf) {
      node.expanded = expanded;
    }
  }
  updateVisibility();
}

function expandAll() {
  setExpandedKeys("all", true);
}

function collapseAll() {
  setExpandedKeys("all", false);
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