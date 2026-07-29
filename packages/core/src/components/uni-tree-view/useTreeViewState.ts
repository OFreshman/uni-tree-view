import { computed, ref, toRaw, watch } from "vue";
import { CHECK_STATUS_MAP, DefaultTreeProps } from "./constants";
import type {
  CheckStatus,
  TreeCheckChangePayload,
  TreeDataItem,
  TreeKey,
  TreeModelValue,
  TreeNode,
  TreeProps
} from "./types";

export interface TreeViewStateProps {
  data?: TreeDataItem[];
  treeProps?: Partial<TreeProps>;
  filterValue?: string;
  filterMethod?: (value: string, node: TreeNode) => boolean;
  modelValue?: TreeModelValue;
  defaultCheckedKeys?: TreeKey | TreeKey[] | null;
  multiple?: boolean;
  checkStrictly?: boolean;
  onlyRadioLeaf?: boolean;
  defaultExpandAll?: boolean;
  defaultExpandedKeys?: TreeKey[] | null;
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
  const visibleTreeList = ref<TreeNode[]>([]);
  const childrenMap = ref<Map<TreeKey, TreeNode[]>>(new Map());
  const nodeMap = ref<Map<TreeKey, TreeNode>>(new Map());
  const cachedExpandedKeys = ref<Set<TreeKey>>(new Set());
  let pendingCheckedKeys = new Set<TreeKey>();
  let initialized = false;

  const resolvedTreeProps = computed<TreeProps>(() => {
    return {
      id: props.treeProps?.id ?? DefaultTreeProps.id,
      label: props.treeProps?.label ?? DefaultTreeProps.label,
      children: props.treeProps?.children ?? DefaultTreeProps.children,
      disabled: props.treeProps?.disabled ?? DefaultTreeProps.disabled,
      leaf: props.treeProps?.leaf ?? DefaultTreeProps.leaf,
      append: props.treeProps?.append ?? DefaultTreeProps.append,
      icon: props.treeProps?.icon ?? DefaultTreeProps.icon
    };
  });

  const isMultiple = computed(() => Boolean(props.multiple));

  watch(
    () => [
      props.data,
      getTreeConfigSignature()
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
      applyConfiguredCheckedState(getInitialCheckedKeys());
    }
  );

  watch(
    () => [props.filterValue, props.filterMethod] as const,
    () => {
      updateVisibility();
    }
  );

  function initializeTree(treeData: TreeDataItem[] = []) {
    const preserveRuntimeChecked = initialized && props.modelValue === undefined;
    const checkedKeys = props.modelValue !== undefined
      ? getInitialCheckedKeys()
      : preserveRuntimeChecked
        ? [...getRawCheckedKeys(), ...pendingCheckedKeys]
        : getInitialCheckedKeys();
    const pendingKeys = preserveRuntimeChecked ? [...pendingCheckedKeys] : checkedKeys;
    syncCachedExpandedKeys();
    childrenMap.value = new Map();
    nodeMap.value = new Map();
    treeList.value = flattenTree(treeData);
    initialized = true;
    applyCheckedState(checkedKeys);
    pendingCheckedKeys = new Set(pendingKeys.filter((key) => !nodeMap.value.has(key)));
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
        updateParentNodesStatus(node.id);
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

    return buildCheckChangePayload(node);
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
        loading: false,
        loadError: null
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
      updateParentNodesStatus(keys);
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

  function applyConfiguredCheckedState(keys: TreeKey[]) {
    applyCheckedState(keys);
    pendingCheckedKeys = new Set(keys.filter((key) => !nodeMap.value.has(key)));
  }

  function applyPendingCheckedState() {
    const resolvedKeys = [...pendingCheckedKeys].filter((key) => nodeMap.value.has(key));
    if (resolvedKeys.length === 0) {
      return;
    }

    for (const key of resolvedKeys) {
      pendingCheckedKeys.delete(key);
    }

    if (isMultiple.value) {
      if (props.checkStrictly) {
        for (const key of resolvedKeys) {
          const node = nodeMap.value.get(key);
          if (node) {
            node.checked = CHECK_STATUS_MAP.checked;
          }
        }
      } else {
        updateNodeAndDescendantsStatus(resolvedKeys, CHECK_STATUS_MAP.checked, true);
        updateParentNodesStatus(resolvedKeys);
      }
      return;
    }

    const node = resolvedKeys
      .map((key) => nodeMap.value.get(key))
      .find((item): item is TreeNode => item !== undefined && (!props.onlyRadioLeaf || item.isLeaf));
    if (node) {
      clearCheckedStatus();
      node.checked = CHECK_STATUS_MAP.checked;
    }
  }

  function applyExpandedState() {
    const defaultExpandedKeys = normalizeKeys(props.defaultExpandedKeys);
    const expandedKeySet = new Set<TreeKey>(defaultExpandedKeys);

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
    const pendingIds = [...(Array.isArray(targetIds) ? targetIds : [targetIds])];

    while (pendingIds.length > 0) {
      const targetId = pendingIds.pop();
      if (targetId === undefined) {
        continue;
      }

      const node = nodeMap.value.get(targetId);
      if (!node || (node.disabled && !includeDisabled && !props.checkedDisabled)) {
        continue;
      }

      node.checked = newStatus;
      const children = childrenMap.value.get(targetId);
      if (children && children.length > 0) {
        for (const child of children) {
          pendingIds.push(child.id);
        }
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

  function updateParentNodesStatus(targetIds?: TreeKey | TreeKey[]) {
    if (props.checkStrictly || !isMultiple.value) {
      return;
    }

    if (targetIds === undefined) {
      for (let index = treeList.value.length - 1; index >= 0; index -= 1) {
        updateNodeFromChildren(treeList.value[index]);
      }
      return;
    }

    const affectedNodes = new Map<TreeKey, TreeNode>();
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    for (const id of ids) {
      const node = nodeMap.value.get(id);
      if (!node) {
        continue;
      }
      if (hasChildren(node.id)) {
        affectedNodes.set(node.id, node);
      }
      for (const parentId of node.parentIds) {
        const parent = nodeMap.value.get(parentId);
        if (parent) {
          affectedNodes.set(parent.id, parent);
        }
      }
    }

    [...affectedNodes.values()]
      .sort((a, b) => b.level - a.level)
      .forEach(updateNodeFromChildren);
  }

  function updateNodeFromChildren(node: TreeNode) {
    const children = childrenMap.value.get(node.id);
    if (!children?.length) {
      return;
    }

    const allChecked = children.every((child) => child.checked === CHECK_STATUS_MAP.checked);
    const allUnchecked = children.every((child) => child.checked === CHECK_STATUS_MAP.unchecked);

    if (allChecked) {
      node.checked = CHECK_STATUS_MAP.checked;
    } else if (allUnchecked) {
      node.checked = CHECK_STATUS_MAP.unchecked;
    } else {
      node.checked = CHECK_STATUS_MAP.indeterminate;
    }
  }

  function updateVisibility() {
    const rawFilterValue = String(props.filterValue ?? "").trim();
    const normalizedFilterValue = rawFilterValue.toLowerCase();
    const visibleNodes: TreeNode[] = [];

    if (rawFilterValue) {
      const visibleKeySet = new Set<TreeKey>();
      for (const node of treeList.value) {
        const matched = props.filterMethod
          ? props.filterMethod(rawFilterValue, node)
          : node.label.toLowerCase().includes(normalizedFilterValue);
        if (!matched) {
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
        if (node.visible) {
          visibleNodes.push(node);
        }
      }
      visibleTreeList.value = visibleNodes;
      return buildFilterPayload(visibleNodes);
    }

    // treeList is pre-order flattened, so parent visibility is already resolved here.
    for (const node of treeList.value) {
      const parent = node.parentId === undefined ? undefined : nodeMap.value.get(node.parentId);
      node.visible = node.level === 0 || Boolean(parent?.visible && parent.expanded);
      if (node.visible) {
        visibleNodes.push(node);
      }
    }

    visibleTreeList.value = visibleNodes;
    return buildFilterPayload(visibleNodes);
  }

  function buildFilterPayload(nodes = visibleTreeList.value) {
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

  function getRawCheckedKeys() {
    return treeList.value
      .filter((node) => node.checked === CHECK_STATUS_MAP.checked)
      .map((node) => node.id);
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
      expandChecked: props.expandChecked,
      cacheExpandedKeys: props.cacheExpandedKeys
    });
  }

  function getCheckedConfigSignature() {
    return JSON.stringify({
      modelValue: props.modelValue,
      defaultCheckedKeys: props.defaultCheckedKeys,
      multiple: props.multiple,
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
    return visibleTreeList.value;
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

  function buildCheckChangePayload(node: TreeNode): TreeCheckChangePayload {
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
      .find((node): node is TreeNode => node !== undefined && (!node.disabled || Boolean(props.checkedDisabled)));
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
          updateParentNodesStatus(normalizedKeys);
        }
      } else {
        for (const key of normalizedKeys) {
          const node = nodeMap.value.get(key);
          if (node && (!node.disabled || props.checkedDisabled)) {
            node.checked = CHECK_STATUS_MAP.unchecked;
          }
        }
      }
      return buildCheckChangePayload(changedNode);
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
        updateParentNodesStatus(normalizedKeys);
      }
    } else {
      clearCheckedStatus();
      changedNode.checked = CHECK_STATUS_MAP.checked;
    }

    return buildCheckChangePayload(changedNode);
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
    const pendingNodes = [...(childrenMap.value.get(nodeId) ?? [])];
    while (pendingNodes.length > 0) {
      const child = pendingNodes.pop();
      if (!child) {
        continue;
      }
      visibleKeySet.add(child.id);
      pendingNodes.push(...(childrenMap.value.get(child.id) ?? []));
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
    applyPendingCheckedState();
    updateParentNodesStatus(node.id);
    updateVisibility();
  }

  async function loadNode(node: TreeNode) {
    if (!props.loadMode || !props.loadApi || node.isLeaf || node.loading || node.loaded) {
      return [];
    }

    node.loading = true;
    node.loadError = null;
    try {
      const children = await props.loadApi(node);
      const normalizedChildren = Array.isArray(children) ? children : [];
      if (nodeMap.value.get(node.id) !== node) {
        return normalizedChildren;
      }
      replaceNodeChildren(node, normalizedChildren);
      return normalizedChildren;
    } catch (error) {
      if (nodeMap.value.get(node.id) !== node) {
        return [];
      }
      node.loadError = error;
      throw error;
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