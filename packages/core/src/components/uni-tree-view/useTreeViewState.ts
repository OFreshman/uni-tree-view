import { computed, ref, toRaw, watch } from "vue";
import { CHECK_STATUS_MAP, DefaultTreeProps } from "./constants";
import type {
  CheckStatus,
  TreeChangePayload,
  TreeDataItem,
  TreeKey,
  TreeModelValue,
  TreeNode,
  TreeProps
} from "./types";

export interface TreeViewStateProps {
  data?: TreeDataItem[];
  treeProps?: Partial<TreeProps>;
  modelValue?: TreeModelValue;
  defaultCheckedKeys?: TreeKey | TreeKey[] | null;
  showCheckbox?: boolean;
  multiple?: boolean;
  checkStrictly?: boolean;
  onlyRadioLeaf?: boolean;
  defaultExpandAll?: boolean;
  defaultExpandedKeys?: TreeKey[] | null;
  defaultExpandedIds?: TreeKey[] | null;
  expandChecked?: boolean;
}

export function useTreeViewState(props: TreeViewStateProps) {
  const treeList = ref<TreeNode[]>([]);
  const childrenMap = ref<Map<TreeKey, TreeNode[]>>(new Map());
  const nodeMap = ref<Map<TreeKey, TreeNode>>(new Map());

  const resolvedTreeProps = computed<TreeProps>(() => ({
    ...DefaultTreeProps,
    ...props.treeProps
  }));

  const isMultiple = computed(() => Boolean(props.multiple || props.showCheckbox));

  const visibleTreeList = computed(() => {
    return treeList.value.filter((item) => item.visible);
  });

  watch(
    () => [
      props.data,
      getTreePropsSignature()
    ] as const,
    () => {
      initializeTree(toRaw(props.data ?? []));
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

  function toggleExpand(node: TreeNode) {
    if (node.isLeaf) {
      return null;
    }

    node.expanded = !node.expanded;
    updateVisibility();
    return {
      expanded: node.expanded,
      node
    };
  }

  function checkNode(node: TreeNode) {
    if (!canSelectNode(node)) {
      return null;
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

    return buildChangePayload(node);
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
        flattenTree(children, level + 1, [...parentIds, id], [...parents, item]);
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
      node.expanded = Boolean(props.defaultExpandAll) || expandedKeySet.has(node.id);
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
        updateNodeAndDescendantsStatus(children.map((child) => child.id), newStatus, includeDisabled);
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

  function setCheckedKeys(keys: TreeKey | TreeKey[], checked = true) {
    const normalizedKeys = normalizeKeys(keys);
    const changedNode = normalizedKeys
      .map((key) => nodeMap.value.get(key))
      .find((node): node is TreeNode => Boolean(node));
    if (!changedNode) {
      return null;
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
      return buildChangePayload(changedNode);
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

    return buildChangePayload(changedNode);
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

  return {
    treeList,
    childrenMap,
    nodeMap,
    resolvedTreeProps,
    isMultiple,
    visibleTreeList,
    initializeTree,
    toggleExpand,
    checkNode,
    applyCheckedState,
    applyExpandedState,
    hasChildren,
    getSelectionIconClass,
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
  };
}