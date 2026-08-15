import { computed, ref, shallowRef, toRaw, watch } from "vue";
import { CHECK_STATUS_MAP, DefaultTreeProps } from "./constants";
import type {
  CheckStatus,
  TreeCheckChangePayload,
  TreeDataItem,
  TreeKey,
  TreeModelValue,
  TreeNode,
  TreeProps,
  UniTreeViewProps
} from "./types";

export type TreeViewStateProps = Pick<
  UniTreeViewProps,
  | "data"
  | "treeProps"
  | "filterValue"
  | "filterMethod"
  | "modelValue"
  | "defaultCheckedKeys"
  | "multiple"
  | "checkStrictly"
  | "accordion"
  | "onlyRadioLeaf"
  | "defaultExpandAll"
  | "defaultExpandedKeys"
  | "defaultExpandParent"
  | "expandChecked"
  | "cacheExpandedKeys"
  | "loadMode"
  | "loadApi"
  | "isLeafFn"
  | "alwaysFirstLoad"
  | "checkedDisabled"
  | "packDisabledKey"
  | "packDisabledkey"
>;

export function useTreeViewState(props: TreeViewStateProps) {
  const treeList = ref<TreeNode[]>([]);
  const visibleTreeList = ref<TreeNode[]>([]);
  const matchedTreeList = ref<TreeNode[]>([]);
  const treeVersion = ref(0);
  const reconciledModelValue = shallowRef<{ value: TreeModelValue } | null>(null);
  const pendingCheckChangePayload = shallowRef<TreeCheckChangePayload | null>(null);
  const childrenMap = ref<Map<TreeKey, TreeNode[]>>(new Map());
  const nodeMap = ref<Map<TreeKey, TreeNode>>(new Map());
  const cachedExpandedKeys = ref<Set<TreeKey>>(new Set());
  let pendingCheckedKeys = new Set<TreeKey>();
  let pendingImperativeCheckedKeys = new Set<TreeKey>();
  let warnedInvalidKeys = new Set<string>();
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
  const resolvedPackDisabledKey = computed(() => {
    return props.packDisabledKey ?? props.packDisabledkey ?? true;
  });

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
    () => [getCheckedValueSignature(), getCheckedBehaviorSignature()] as const,
    ([, behaviorSignature], [, previousBehaviorSignature]) => {
      const checkedKeys = getInitialCheckedKeys();
      if (behaviorSignature === previousBehaviorSignature && isConfiguredCheckedStateCurrent(checkedKeys)) {
        return;
      }
      applyConfiguredCheckedState(checkedKeys);
    }
  );

  watch(
    () => [props.filterValue, props.filterMethod] as const,
    () => {
      updateVisibility();
    }
  );

  function initializeTree(treeData: TreeDataItem[] = []) {
    const wasInitialized = initialized;
    const preserveRuntimeChecked = initialized && props.modelValue === undefined;
    const checkedKeys = props.modelValue !== undefined
      ? getInitialCheckedKeys()
      : preserveRuntimeChecked
        ? isMultiple.value
          ? [...getRawCheckedKeys(), ...pendingCheckedKeys]
          : [...pendingImperativeCheckedKeys, ...pendingCheckedKeys, ...getRawCheckedKeys()]
        : getInitialCheckedKeys();
    const pendingKeys = preserveRuntimeChecked ? [...pendingCheckedKeys] : checkedKeys;
    const imperativeKeys = [...pendingImperativeCheckedKeys];
    syncCachedExpandedKeys();
    childrenMap.value = new Map();
    nodeMap.value = new Map();
    warnedInvalidKeys = new Set();
    treeList.value = flattenTree(treeData);
    treeVersion.value += 1;
    initialized = true;
    applyCheckedState(checkedKeys);
    pendingCheckedKeys = new Set(pendingKeys.filter((key) => !nodeMap.value.has(key)));
    const resolvedImperativeKeys = imperativeKeys.filter((key) => nodeMap.value.has(key));
    pendingImperativeCheckedKeys = new Set(
      imperativeKeys.filter((key) => pendingCheckedKeys.has(key))
    );
    applyExpandedState();
    publishPendingSelectionChange(resolvedImperativeKeys);
    reconcileMissingControlledKeys(wasInitialized, checkedKeys);
  }

  function toggleExpand(node: TreeNode) {
    if (!isExpandable(node)) {
      return null;
    }

    const nextExpanded = !node.expanded;
    if (nextExpanded && props.accordion) {
      const siblings = node.parentId === undefined
        ? treeList.value.filter((item) => item.level === 0)
        : childrenMap.value.get(node.parentId) ?? [];
      for (const sibling of siblings) {
        if (sibling !== node && sibling.expanded) {
          sibling.expanded = false;
          syncExpandedCacheForNode(sibling);
        }
      }
    }

    node.expanded = nextExpanded;
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
      warnAboutInvalidKey(id, label);

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

      if (id !== undefined && id !== null && nodeMap.value.has(id)) {
        warnOnce(
          `duplicate:${String(id)}`,
          `[uni-tree-view] 检测到重复节点 key：${String(id)}。请确保 tree-props.id 映射的值在整棵树中唯一。`
        );
      }
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
          if (node && canSelectDisabledNode(node)) {
            node.checked = CHECK_STATUS_MAP.checked;
          }
        }
        return;
      }

      updateNodeAndDescendantsStatus(keys, CHECK_STATUS_MAP.checked, Boolean(props.checkedDisabled));
      updateParentNodesStatus(keys);
      return;
    }

    const firstSelectableKey = keys.find((key) => {
      const node = nodeMap.value.get(key);
      return node && canSelectDisabledNode(node) && (!props.onlyRadioLeaf || node.isLeaf);
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
    pendingImperativeCheckedKeys = new Set();
  }

  function applyPendingCheckedState() {
    const resolvedKeys = [...pendingCheckedKeys].filter((key) => nodeMap.value.has(key));
    if (resolvedKeys.length === 0) {
      return;
    }

    const resolvedImperativeKeys = resolvedKeys.filter((key) => pendingImperativeCheckedKeys.has(key));
    for (const key of resolvedKeys) {
      pendingCheckedKeys.delete(key);
      pendingImperativeCheckedKeys.delete(key);
    }

    if (isMultiple.value) {
      if (props.checkStrictly) {
        for (const key of resolvedKeys) {
          const node = nodeMap.value.get(key);
          if (node && canSelectDisabledNode(node)) {
            node.checked = CHECK_STATUS_MAP.checked;
          }
        }
      } else {
        updateNodeAndDescendantsStatus(resolvedKeys, CHECK_STATUS_MAP.checked, Boolean(props.checkedDisabled));
        updateParentNodesStatus(resolvedKeys);
      }
      publishPendingSelectionChange(resolvedImperativeKeys);
      return;
    }

    const node = resolvedKeys
      .map((key) => nodeMap.value.get(key))
      .find((item): item is TreeNode => item !== undefined && canSelectNode(item));
    if (node) {
      clearCheckedStatus();
      node.checked = CHECK_STATUS_MAP.checked;
    }
    publishPendingSelectionChange(resolvedImperativeKeys);
  }

  function applyExpandedState() {
    const defaultExpandedKeys = normalizeKeys(props.defaultExpandedKeys);
    const expandedKeySet = new Set<TreeKey>(defaultExpandedKeys);

    if (props.defaultExpandParent !== false) {
      for (const key of defaultExpandedKeys) {
        const node = nodeMap.value.get(key);
        if (!node) {
          continue;
        }

        for (const parentId of node.parentIds) {
          expandedKeySet.add(parentId);
        }
      }
    }

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
      const matchedNodes: TreeNode[] = [];
      for (const node of treeList.value) {
        const matched = props.filterMethod
          ? props.filterMethod(rawFilterValue, node)
          : node.label.toLowerCase().includes(normalizedFilterValue);
        if (!matched) {
          continue;
        }

        matchedNodes.push(node);
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
      matchedTreeList.value = matchedNodes;
      return buildFilterPayload(visibleNodes, matchedNodes);
    }

    matchedTreeList.value = [];

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

  function buildFilterPayload(
    nodes = visibleTreeList.value,
    matchedNodes = matchedTreeList.value
  ) {
    return {
      value: String(props.filterValue ?? ""),
      keys: nodes.map((node) => node.id),
      nodes,
      matchedKeys: matchedNodes.map((node) => node.id),
      matchedNodes
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
    if (!canSelectDisabledNode(node)) {
      return false;
    }

    if (!isMultiple.value && props.onlyRadioLeaf && !node.isLeaf) {
      return false;
    }

    return true;
  }

  function canSelectDisabledNode(node: TreeNode) {
    return !node.disabled || Boolean(props.checkedDisabled);
  }

  function clearCheckedStatus() {
    for (const node of treeList.value) {
      if (!canSelectDisabledNode(node)) {
        continue;
      }
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
      defaultExpandParent: props.defaultExpandParent,
      expandChecked: props.expandChecked,
      cacheExpandedKeys: props.cacheExpandedKeys
    });
  }

  function getCheckedValueSignature() {
    return JSON.stringify({
      controlled: props.modelValue !== undefined,
      value: props.modelValue !== undefined ? props.modelValue : props.defaultCheckedKeys
    });
  }

  function getCheckedBehaviorSignature() {
    return JSON.stringify({
      multiple: props.multiple,
      checkStrictly: props.checkStrictly,
      onlyRadioLeaf: props.onlyRadioLeaf,
      checkedDisabled: props.checkedDisabled,
      packDisabledKey: resolvedPackDisabledKey.value
    });
  }

  function isConfiguredCheckedStateCurrent(keys: TreeKey[]) {
    const expectedKeySet = new Set(keys);
    const currentKeySet = new Set([...getCheckedKeys(), ...pendingCheckedKeys]);
    if (expectedKeySet.size !== currentKeySet.size) {
      return false;
    }
    return [...expectedKeySet].every((key) => currentKeySet.has(key));
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
      return resolvedPackDisabledKey.value || !node.disabled;
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

  function getMatchedKeys() {
    return getMatchedNodes().map((node) => node.id);
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

  function getMatchedNodes() {
    return matchedTreeList.value;
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

  function buildCheckChangePayload(node: TreeNode): TreeCheckChangePayload {
    const nodes = getCheckedNodes();
    const keys = nodes.map((checkedNode) => checkedNode.id);
    return {
      value: isMultiple.value ? keys : (keys[0] ?? null),
      keys,
      nodes,
      halfCheckedKeys: getHalfCheckedKeys(),
      halfCheckedNodes: getHalfCheckedNodes(),
      node
    };
  }

  function publishPendingSelectionChange(keys: TreeKey[]) {
    const changedNode = keys
      .map((key) => nodeMap.value.get(key))
      .find((node): node is TreeNode => node !== undefined && canSelectNode(node));
    if (changedNode) {
      pendingCheckChangePayload.value = buildCheckChangePayload(changedNode);
    }
  }

  function reconcileMissingControlledKeys(wasInitialized: boolean, configuredKeys: TreeKey[]) {
    if (!wasInitialized || props.modelValue === undefined || props.loadMode) {
      return;
    }
    if (!configuredKeys.some((key) => !nodeMap.value.has(key))) {
      return;
    }

    const keys = getCheckedKeys();
    reconciledModelValue.value = {
      value: isMultiple.value ? keys : (keys[0] ?? null)
    };
  }

  function warnAboutInvalidKey(id: TreeKey, label: string) {
    if (id !== undefined && id !== null) {
      return;
    }
    warnOnce(
      "missing",
      `[uni-tree-view] 检测到缺失节点 key。请检查 tree-props.id 映射；问题节点 label：${label || "(空)"}`
    );
  }

  function warnOnce(key: string, message: string) {
    if (!(import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV || warnedInvalidKeys.has(key)) {
      return;
    }
    warnedInvalidKeys.add(key);
    console.warn(message);
  }

  function setCheckedKeys(keys: TreeKey | TreeKey[], checked = true) {
    const normalizedKeys = normalizeKeys(keys);

    if (!checked) {
      for (const key of normalizedKeys) {
        pendingCheckedKeys.delete(key);
        pendingImperativeCheckedKeys.delete(key);
      }
      const changedNode = normalizedKeys
        .map((key) => nodeMap.value.get(key))
        .find((node): node is TreeNode => node !== undefined && canSelectNode(node));
      if (!changedNode) {
        return null;
      }

      if (isMultiple.value) {
        if (props.checkStrictly) {
          for (const key of normalizedKeys) {
            const node = nodeMap.value.get(key);
            if (node && canSelectDisabledNode(node)) {
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
          if (node && canSelectNode(node)) {
            node.checked = CHECK_STATUS_MAP.unchecked;
          }
        }
      }
      return buildCheckChangePayload(changedNode);
    }

    if (!isMultiple.value) {
      const targetKey = normalizedKeys.find((key) => {
        const node = nodeMap.value.get(key);
        return node === undefined || canSelectNode(node);
      });
      if (targetKey === undefined) {
        return null;
      }

      const targetNode = nodeMap.value.get(targetKey);
      pendingCheckedKeys = new Set();
      pendingImperativeCheckedKeys = new Set();
      if (!targetNode) {
        pendingCheckedKeys.add(targetKey);
        pendingImperativeCheckedKeys.add(targetKey);
        return null;
      }

      clearCheckedStatus();
      targetNode.checked = CHECK_STATUS_MAP.checked;
      return buildCheckChangePayload(targetNode);
    }

    const unresolvedKeys = normalizedKeys.filter((key) => !nodeMap.value.has(key));
    for (const key of unresolvedKeys) {
      pendingCheckedKeys.add(key);
      pendingImperativeCheckedKeys.add(key);
    }
    const changedNode = normalizedKeys
      .map((key) => nodeMap.value.get(key))
      .find((node): node is TreeNode => node !== undefined && canSelectNode(node));
    if (!changedNode) {
      return null;
    }

    if (props.checkStrictly) {
      for (const key of normalizedKeys) {
        const node = nodeMap.value.get(key);
        if (node && canSelectDisabledNode(node)) {
          node.checked = CHECK_STATUS_MAP.checked;
        }
      }
    } else {
      updateNodeAndDescendantsStatus(normalizedKeys, CHECK_STATUS_MAP.checked, Boolean(props.checkedDisabled));
      updateParentNodesStatus(normalizedKeys);
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
    treeVersion.value += 1;
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
    matchedTreeList,
    treeVersion,
    reconciledModelValue,
    pendingCheckChangePayload,
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
    getMatchedKeys,
    getExpandedNodes,
    getUnexpandedNodes,
    getVisibleNodes,
    getMatchedNodes,
    getNode,
    getNodePath,
    expandAll,
    collapseAll,
    loadNode
  };
}