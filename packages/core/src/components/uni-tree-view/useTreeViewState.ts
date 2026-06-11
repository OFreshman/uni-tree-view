import { computed, ref, toRaw, watch } from "vue";
import { CHECK_STATUS_MAP, DefaultTreeProps } from "./constants";
import type {
  CheckStatus,
  TreeChangePayload,
  TreeDataItem,
  TreeKey,
  TreeLegacyField,
  TreeModelValue,
  TreeNode,
  TreeProps
} from "./types";

export interface TreeViewStateProps {
  data?: TreeDataItem[];
  treeProps?: Partial<TreeProps>;
  field?: TreeLegacyField | null;
  labelField?: string;
  valueField?: string;
  childrenField?: string;
  disabledField?: string;
  leafField?: string;
  appendField?: string;
  iconField?: string;
  filterValue?: string;
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
  cacheExpandedKeys?: boolean;
  loadMode?: boolean;
  loadApi?: (node: TreeNode) => TreeDataItem[] | Promise<TreeDataItem[]>;
  isLeafFn?: (item: TreeDataItem, node: TreeNode) => boolean;
  alwaysFirstLoad?: boolean;
  checkedDisabled?: boolean;
  packDisabledkey?: boolean;
}

export function useTreeViewState(props: TreeViewStateProps) {
  const treeList = ref<TreeNode[]>([]);
  const childrenMap = ref<Map<TreeKey, TreeNode[]>>(new Map());
  const nodeMap = ref<Map<TreeKey, TreeNode>>(new Map());
  const cachedExpandedKeys = ref<Set<TreeKey>>(new Set());

  const resolvedTreeProps = computed<TreeProps>(() => {
    const field = props.field ?? {};
    return {
      ...DefaultTreeProps,
      id: props.treeProps?.id ?? field.id ?? field.key ?? field.value ?? props.valueField ?? DefaultTreeProps.id,
      label: props.treeProps?.label ?? field.label ?? props.labelField ?? DefaultTreeProps.label,
      children: props.treeProps?.children ?? field.children ?? props.childrenField ?? DefaultTreeProps.children,
      disabled: props.treeProps?.disabled ?? field.disabled ?? props.disabledField ?? DefaultTreeProps.disabled,
      leaf: props.treeProps?.leaf ?? field.leaf ?? props.leafField ?? DefaultTreeProps.leaf,
      append: props.treeProps?.append ?? field.append ?? props.appendField ?? DefaultTreeProps.append,
      icon: props.treeProps?.icon ?? field.icon ?? props.iconField ?? DefaultTreeProps.icon,
      class: props.treeProps?.class ?? DefaultTreeProps.class
    };
  });

  const isMultiple = computed(() => Boolean(props.multiple || props.showCheckbox));

  const visibleTreeList = computed(() => {
    return treeList.value.filter((item) => item.visible);
  });

  watch(
    () => [
      props.data,
      getTreeConfigSignature(),
      props.isLeafFn
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

  watch(
    () => props.filterValue,
    () => {
      updateVisibility();
    }
  );

  function initializeTree(treeData: TreeDataItem[] = []) {
    syncCachedExpandedKeys();
    childrenMap.value = new Map();
    nodeMap.value = new Map();
    treeList.value = flattenTree(treeData);
    applyCheckedState(getInitialCheckedKeys());
    applyExpandedState();
  }

  function toggleExpand(node: TreeNode) {
    if (!isExpandable(node)) {
      return null;
    }

    node.expanded = !node.expanded;
    if (props.cacheExpandedKeys) {
      if (node.expanded) {
        cachedExpandedKeys.value.add(node.id);
      } else {
        cachedExpandedKeys.value.delete(node.id);
      }
    }
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
    const nodes: TreeNode[] = [];
    const {
      id: idKey,
      label: labelKey,
      children: childrenKey,
      disabled: disabledKey = "disabled",
      append: appendKey = "append",
      icon: iconKey = "icon"
    } = resolvedTreeProps.value;
    list.forEach((item) => {
      const id = item[idKey] as TreeKey;
      const children = item[childrenKey];
      const label = String(item[labelKey] ?? "");

      const treeNode: TreeNode = {
        id,
        label,
        append: String(item[appendKey] ?? ""),
        icon: String(item[iconKey] ?? ""),
        path: [...parents.map((parent) => String(parent[labelKey] ?? "")), label],
        source: item,
        parentId: parentIds[parentIds.length - 1],
        parentIds,
        parents,
        level,
        expanded: false,
        visible: level === 0,
        disabled: Boolean(item[disabledKey]),
        checked: CHECK_STATUS_MAP.unchecked,
        isLeaf: false,
        loaded: false,
        loading: false
      };
      treeNode.isLeaf = resolveIsLeaf(item, treeNode);
      treeNode.loaded = treeNode.isLeaf || !props.loadMode || (Array.isArray(children) && children.length > 0 && !props.alwaysFirstLoad);
      nodes.push(treeNode);

      nodeMap.value.set(id, treeNode);
      const parentId = parentIds.slice(-1)[0];
      if (parentId !== undefined) {
        if (!childrenMap.value.has(parentId)) {
          childrenMap.value.set(parentId, []);
        }
        childrenMap.value.get(parentId)!.push(treeNode);
      }

      if (Array.isArray(children) && children.length > 0) {
        nodes.push(...flattenTree(children, level + 1, [...parentIds, id], [...parents, item]));
      }
    });

    return nodes;
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
      node.expanded = Boolean(props.defaultExpandAll)
        || expandedKeySet.has(node.id)
        || (Boolean(props.cacheExpandedKeys) && cachedExpandedKeys.value.has(node.id));
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
      if (!node || (node.disabled && !includeDisabled && !props.checkedDisabled)) {
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

  function isExpandable(node: TreeNode) {
    return !node.isLeaf && (hasChildren(node.id) || Boolean(props.loadMode));
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
    const filterValue = String(props.filterValue ?? "").trim().toLowerCase();
    if (filterValue) {
      const visibleKeySet = new Set<TreeKey>();
      for (const node of treeList.value) {
        if (!node.label.toLowerCase().includes(filterValue)) {
          continue;
        }

        visibleKeySet.add(node.id);
        for (const parentId of node.parentIds) {
          visibleKeySet.add(parentId);
        }
        addDescendantVisibleKeys(node.id, visibleKeySet);
      }

      for (const node of treeList.value) {
        node.visible = visibleKeySet.has(node.id);
      }
      return buildFilterPayload();
    }

    for (const node of treeList.value) {
      node.visible = node.level === 0 || node.parentIds.every((parentId) => {
        return nodeMap.value.get(parentId)?.expanded;
      });
    }

    return buildFilterPayload();
  }

  function buildFilterPayload() {
    const nodes = getVisibleNodes();
    return {
      value: String(props.filterValue ?? ""),
      keys: nodes.map((node) => node.id),
      nodes
    };
  }

  function syncCachedExpandedKeys() {
    if (!props.cacheExpandedKeys) {
      return;
    }

    for (const node of treeList.value) {
      if (node.expanded) {
        cachedExpandedKeys.value.add(node.id);
      } else {
        cachedExpandedKeys.value.delete(node.id);
      }
    }
  }

  function canSelectNode(node: TreeNode) {
    if (node.disabled && !props.checkedDisabled) {
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

  function getTreeConfigSignature() {
    return JSON.stringify({
      treeProps: resolvedTreeProps.value,
      loadMode: props.loadMode,
      alwaysFirstLoad: props.alwaysFirstLoad
    });
  }

  function getExpansionConfigSignature() {
    return JSON.stringify({
      defaultExpandAll: props.defaultExpandAll,
      defaultExpandedKeys: normalizeKeys(props.defaultExpandedKeys),
      defaultExpandedIds: normalizeKeys(props.defaultExpandedIds),
      expandChecked: props.expandChecked,
      cacheExpandedKeys: props.cacheExpandedKeys
    });
  }

  function getCheckedConfigSignature() {
    return JSON.stringify({
      modelValue: props.modelValue,
      defaultCheckedKeys: props.defaultCheckedKeys,
      multiple: props.multiple,
      showCheckbox: props.showCheckbox,
      checkStrictly: props.checkStrictly,
      onlyRadioLeaf: props.onlyRadioLeaf,
      checkedDisabled: props.checkedDisabled,
      packDisabledkey: props.packDisabledkey
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
    return treeList.value.filter((node) => {
      if (node.checked !== CHECK_STATUS_MAP.checked) {
        return false;
      }
      return props.packDisabledkey !== false || !node.disabled;
    });
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

  function getVisibleKeys() {
    return getVisibleNodes().map((node) => node.id);
  }

  function getExpandedNodes() {
    return treeList.value.filter((node) => !node.isLeaf && node.expanded);
  }

  function getUnexpandedNodes() {
    return treeList.value.filter((node) => !node.isLeaf && !node.expanded);
  }

  function getVisibleNodes() {
    return treeList.value.filter((node) => node.visible);
  }

  function getNode(key: TreeKey) {
    return nodeMap.value.get(key);
  }

  function getNodePath(keyOrNode: TreeKey | TreeNode) {
    const targetNode = typeof keyOrNode === "object" ? keyOrNode : nodeMap.value.get(keyOrNode);
    if (!targetNode) {
      return [];
    }

    return [...targetNode.parentIds, targetNode.id]
      .map((key) => nodeMap.value.get(key))
      .filter((node): node is TreeNode => Boolean(node));
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
      .find((node): node is TreeNode => Boolean(node) && (!node.disabled || Boolean(props.checkedDisabled)));
    if (!changedNode) {
      return null;
    }

    if (!checked) {
      if (isMultiple.value) {
        if (props.checkStrictly) {
          for (const key of normalizedKeys) {
            const node = nodeMap.value.get(key);
            if (node && (!node.disabled || props.checkedDisabled)) {
              node.checked = CHECK_STATUS_MAP.unchecked;
            }
          }
        } else {
          updateNodeAndDescendantsStatus(normalizedKeys, CHECK_STATUS_MAP.unchecked, Boolean(props.checkedDisabled));
          updateParentNodesStatus();
        }
      } else {
        for (const key of normalizedKeys) {
          const node = nodeMap.value.get(key);
          if (node && (!node.disabled || props.checkedDisabled)) {
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
          if (node && (!node.disabled || props.checkedDisabled)) {
            node.checked = CHECK_STATUS_MAP.checked;
          }
        }
      } else {
        updateNodeAndDescendantsStatus(normalizedKeys, CHECK_STATUS_MAP.checked, Boolean(props.checkedDisabled));
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
          syncExpandedCacheForNode(node);
        }
      }
      updateVisibility();
      return;
    }

    for (const key of keys) {
      const node = nodeMap.value.get(key);
      if (node && !node.isLeaf) {
        node.expanded = expanded;
        syncExpandedCacheForNode(node);
      }
    }
    updateVisibility();
  }

  function syncExpandedCacheForNode(node: TreeNode) {
    if (!props.cacheExpandedKeys) {
      return;
    }

    if (node.expanded) {
      cachedExpandedKeys.value.add(node.id);
    } else {
      cachedExpandedKeys.value.delete(node.id);
    }
  }

  function expandAll() {
    setExpandedKeys("all", true);
  }

  function collapseAll() {
    setExpandedKeys("all", false);
  }

  function resolveIsLeaf(item: TreeDataItem, node: TreeNode) {
    if (props.isLeafFn) {
      return props.isLeafFn(item, node);
    }

    const { children: childrenKey, leaf: leafKey = "leaf" } = resolvedTreeProps.value;
    const children = item[childrenKey];
    if (props.loadMode && item[leafKey] !== undefined) {
      return Boolean(item[leafKey]);
    }

    if (props.loadMode) {
      return false;
    }

    return !(Array.isArray(children) && children.length > 0);
  }

  function addDescendantVisibleKeys(nodeId: TreeKey, visibleKeySet: Set<TreeKey>) {
    const children = childrenMap.value.get(nodeId);
    if (!children?.length) {
      return;
    }

    for (const child of children) {
      visibleKeySet.add(child.id);
      addDescendantVisibleKeys(child.id, visibleKeySet);
    }
  }

  function removeDescendants(nodeId: TreeKey) {
    const children = childrenMap.value.get(nodeId) ?? [];
    const descendantIds = new Set<TreeKey>();
    for (const child of children) {
      collectDescendantIds(child.id, descendantIds);
    }

    if (descendantIds.size === 0) {
      return;
    }

    treeList.value = treeList.value.filter((node) => !descendantIds.has(node.id));
    for (const id of descendantIds) {
      nodeMap.value.delete(id);
      childrenMap.value.delete(id);
    }
    childrenMap.value.delete(nodeId);
  }

  function collectDescendantIds(nodeId: TreeKey, ids: Set<TreeKey>) {
    ids.add(nodeId);
    const children = childrenMap.value.get(nodeId);
    if (!children?.length) {
      return;
    }

    for (const child of children) {
      collectDescendantIds(child.id, ids);
    }
  }

  function replaceNodeChildren(node: TreeNode, children: TreeDataItem[]) {
    const shouldInheritChecked = isMultiple.value
      && !props.checkStrictly
      && node.checked === CHECK_STATUS_MAP.checked;
    removeDescendants(node.id);

    const childNodes = flattenTree(children, node.level + 1, [...node.parentIds, node.id], [...node.parents, node.source]);
    const nodeIndex = treeList.value.findIndex((item) => item.id === node.id);
    if (nodeIndex === -1) {
      treeList.value.push(...childNodes);
    } else {
      treeList.value.splice(nodeIndex + 1, 0, ...childNodes);
    }

    node.isLeaf = children.length === 0 && Boolean(props.loadMode);
    node.loaded = true;
    if (shouldInheritChecked) {
      updateNodeAndDescendantsStatus(childNodes.map((child) => child.id), CHECK_STATUS_MAP.checked);
    }
    updateParentNodesStatus();
    updateVisibility();
  }

  async function loadNode(node: TreeNode) {
    if (!props.loadMode || !props.loadApi || node.isLeaf || node.loading || node.loaded) {
      return [];
    }

    node.loading = true;
    try {
      const children = await props.loadApi(node);
      const normalizedChildren = Array.isArray(children) ? children : [];
      replaceNodeChildren(node, normalizedChildren);
      return normalizedChildren;
    } finally {
      node.loading = false;
    }
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
    isExpandable,
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
    getVisibleKeys,
    getExpandedNodes,
    getUnexpandedNodes,
    getVisibleNodes,
    getNode,
    getNodePath,
    expandAll,
    collapseAll,
    loadNode
  };
}