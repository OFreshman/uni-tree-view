<template>
  <view
    class="uni-tree-view-container"
    :style="{ '--theme-color': props.themeColor }">
    <scroll-view
      class="scroll-view-container"
      :scroll-y="true"
      :scroll-top="virtualEnabled ? virtualScrollCommandTop : undefined"
      :scroll-into-view="scrollIntoView"
      :style="scrollViewStyle"
      @scroll="handleVirtualScroll">
      <view v-if="visibleTreeList.length === 0" class="utv-tree-empty">
        <slot name="empty" :filter-value="props.filterValue">
          {{ props.emptyText }}
        </slot>
      </view>
      <view
        v-if="virtualEnabled && virtualTopPadding > 0"
        class="utv-tree-virtual-spacer"
        :style="{ height: `${virtualTopPadding}px` }"></view>
      <view
        v-for="item in renderedTreeList"
        :id="item.domId"
        :key="item.node.id"
        :style="{
          paddingLeft: `${item.node.level * props.indent}rpx`,
          height: virtualEnabled ? `${props.virtualItemHeight}px` : undefined,
          minHeight: virtualEnabled ? `${props.virtualItemHeight}px` : undefined
        }"
        class="utv-tree-item"
        :class="[
          props.nodeClass,
          {
            'is-leaf': item.node.isLeaf,
            'is-expanded': item.node.expanded,
            'is-disabled': item.node.disabled,
            'is-checked': props.selectable && item.node.checked === 'checked',
            'is-virtual': virtualEnabled
          }
        ]"
        :hover-class="item.node.disabled ? 'none' : 'utv-tree-item--hover'"
        :hover-stay-time="80"
        @click="handleNodeClick(item.node)">
        <view
          v-if="isExpandable(item.node)"
          class="utv-tree-item__arrow-icon is-right"
          :class="{
            'is-expand': item.node.expanded,
            'is-loading': item.node.loading,
            'is-load-error': Boolean(item.node.loadError)
          }"
          @click.stop="handleToggleExpand(item.node)"></view>
        <view v-else class="utv-tree-item__arrow-placeholder"></view>

        <view
          v-if="showSelectionControl && props.selectionPlacement === 'left'"
          class="utv-tree-item__checkbox"
          :class="{ 'is-disabled': item.node.disabled }"
          @click.stop="handleCheckChange(item.node)">
          <view
            class="utv-tree-item__checkbox-icon"
            :class="getSelectionIconClass(item.node)"></view>
        </view>

        <view class="utv-tree-node-content">
          <slot
            name="default"
            :node="item.node"
            :data="item.node.source"
            :path="item.path">
            <view v-if="item.node.icon || slots.icon" class="utv-tree-node-icon">
              <slot
                name="icon"
                :node="item.node"
                :data="item.node.source"
                :path="item.path">
                {{ item.node.icon }}
              </slot>
            </view>
            <view class="utv-tree-node-main">
              <view class="utv-tree-node-label">
                <slot
                  name="label"
                  :node="item.node"
                  :data="item.node.source"
                  :path="item.path">
                  <text
                    v-for="(segment, segmentIndex) in getLabelSegments(item.node.label)"
                    :key="segmentIndex"
                    :class="{ 'utv-tree-node-label__match': segment.matched }">
                    {{ segment.text }}
                  </text>
                </slot>
              </view>
              <view v-if="props.showPath" class="utv-tree-node-path">
                {{ item.node.path.join(props.pathSeparator) }}
              </view>
            </view>
            <view v-if="item.node.append || slots.append" class="utv-tree-node-append">
              <slot
                name="append"
                :node="item.node"
                :data="item.node.source"
                :path="item.path">
                {{ item.node.append }}
              </slot>
            </view>
          </slot>
        </view>

        <view
          v-if="showSelectionControl && props.selectionPlacement === 'right'"
          class="utv-tree-item__checkbox"
          :class="{ 'is-disabled': item.node.disabled }"
          @click.stop="handleCheckChange(item.node)">
          <view
            class="utv-tree-item__checkbox-icon"
            :class="getSelectionIconClass(item.node)"></view>
        </view>
      </view>
      <view
        v-if="virtualEnabled && virtualBottomPadding > 0"
        class="utv-tree-virtual-spacer"
        :style="{ height: `${virtualBottomPadding}px` }"></view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { computed, nextTick, shallowRef, watch } from "vue";
import type {
  TreeCheckChangePayload,
  TreeKey,
  TreeNode,
  TreeScrollToOptions,
  UniTreeViewEmits,
  UniTreeViewExposed,
  UniTreeViewProps,
  UniTreeViewSlots
} from "./types";
import { useTreeViewState } from "./useTreeViewState";
import { useVirtualTreeList } from "./useVirtualTreeList";

defineOptions({
  name: "UniTreeView",
  options: {
    // #ifdef MP-WEIXIN || MP-ALIPAY
    virtualHost: true
    // #endif
  }
});

const props = withDefaults(defineProps<UniTreeViewProps>(), {
  modelValue: undefined,
  data: () => [],
  treeProps: undefined,
  filterValue: "",
  filterMethod: undefined,
  highlightFilter: true,
  themeColor: "#007aff",
  selectable: false,
  showRadioIcon: true,
  multiple: false,
  checkOnClickNode: false,
  expandOnClickNode: false,
  checkStrictly: false,
  onlyRadioLeaf: false,
  defaultExpandAll: false,
  defaultExpandedKeys: () => [],
  defaultExpandParent: true,
  expandChecked: false,
  cacheExpandedKeys: false,
  defaultCheckedKeys: () => [],
  loadMode: false,
  loadApi: undefined,
  isLeafFn: undefined,
  alwaysFirstLoad: false,
  checkedDisabled: false,
  packDisabledKey: undefined,
  packDisabledkey: undefined,
  nodeClass: "",
  indent: 40,
  selectionPlacement: "left",
  emptyText: "暂无数据",
  showPath: false,
  pathSeparator: " / ",
  virtual: false,
  virtualItemHeight: 36,
  virtualHeight: 400,
  virtualOverscan: 8
});

const emit = defineEmits<UniTreeViewEmits>();
const slots = defineSlots<UniTreeViewSlots>();
const scrollIntoView = shallowRef("");
const virtualScrollCommandTop = shallowRef<number>();
const nodeDomIds = new Map<TreeKey, string>();
let nextNodeDomId = 0;

const {
  isMultiple,
  visibleTreeList,
  toggleExpand,
  checkNode,
  isExpandable,
  getSelectionIconClass,
  loadNode: loadStateNode,
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
  getVisibleKeys,
  getExpandedNodes,
  getUnexpandedNodes,
  getVisibleNodes,
  getNode,
  getNodePath,
  expandAll,
  collapseAll
} = useTreeViewState(props);

const showSelectionControl = computed(() => {
  return Boolean(props.selectable && (isMultiple.value || props.showRadioIcon));
});

const {
  virtualEnabled,
  renderedItems: virtualRenderedTreeList,
  scrollTop: virtualScrollTop,
  topPadding: virtualTopPadding,
  bottomPadding: virtualBottomPadding,
  scrollViewStyle,
  handleScroll: handleVirtualScroll,
  scrollToIndex
} = useVirtualTreeList({
  items: visibleTreeList,
  virtual: () => props.virtual,
  itemHeight: () => props.virtualItemHeight,
  height: () => props.virtualHeight,
  overscan: () => props.virtualOverscan
});

interface RenderedTreeItem {
  node: TreeNode;
  path: TreeNode[];
  domId: string;
}

const needsRenderedNodePath = computed(() => {
  return Boolean(slots.default || slots.icon || slots.label || slots.append);
});

const renderedTreeList = computed(() => {
  const includePath = needsRenderedNodePath.value;
  return virtualRenderedTreeList.value.map((node): RenderedTreeItem => ({
    node,
    path: includePath ? getNodePath(node) : [],
    domId: getNodeDomId(node)
  }));
});

async function handleToggleExpand(node: TreeNode) {
  if (node.loadError && !node.loading) {
    await retryLoadSafely(node);
    return;
  }

  const shouldLoad = !node.loaded;
  const payload = toggleExpand(node);
  if (!payload) {
    return;
  }

  emit("expand-change", payload);

  if (payload.expanded && shouldLoad) {
    await loadNodeSafely(node);
  }
}

function handleNodeClick(node: TreeNode) {
  emit("node-click", {
    id: node.id,
    node,
    path: getNodePath(node)
  });

  if (props.expandOnClickNode && isExpandable(node)) {
    void handleToggleExpand(node);
  }
  if (props.selectable && props.checkOnClickNode) {
    handleCheckChange(node);
  }
}

async function loadNode(node: TreeNode) {
  const wasLoaded = node.loaded;
  try {
    const children = await loadStateNode(node);
    if (!wasLoaded && node.loaded) {
      emit("load", { node, children });
    }
    return children;
  } catch (error) {
    emit("load-error", { node, error });
    throw error;
  }
}

async function loadNodeSafely(node: TreeNode) {
  try {
    await loadNode(node);
  } catch {
    // The load-error event carries the failure and the node remains retryable.
  }
}

async function retryLoad(keyOrNode: TreeKey | TreeNode) {
  const node = typeof keyOrNode === "object" ? keyOrNode : getNode(keyOrNode);
  if (!node) {
    return [];
  }
  return loadNode(node);
}

async function retryLoadSafely(node: TreeNode) {
  try {
    await retryLoad(node);
  } catch {
    // The load-error event carries the failure and another retry remains possible.
  }
}

async function scrollToKey(key: TreeKey, options: TreeScrollToOptions = {}) {
  const node = getNode(key);
  if (!node) {
    return false;
  }

  if (options.expandParents !== false && node.parentIds.length > 0) {
    setExpandedKeys(node.parentIds, true);
  }
  await nextTick();

  const visibleIndex = visibleTreeList.value.findIndex((item) => item.id === key);
  if (visibleIndex === -1) {
    return false;
  }

  if (virtualEnabled.value) {
    virtualScrollCommandTop.value = undefined;
    await nextTick();
    if (!scrollToIndex(visibleIndex)) {
      return false;
    }
    virtualScrollCommandTop.value = virtualScrollTop.value;
    return true;
  }

  scrollIntoView.value = "";
  await nextTick();
  scrollIntoView.value = getNodeDomId(node);
  return true;
}

function getNodeDomId(node: TreeNode) {
  const cachedDomId = nodeDomIds.get(node.id);
  if (cachedDomId) {
    return cachedDomId;
  }

  nextNodeDomId += 1;
  const domId = `utv-tree-node-${nextNodeDomId}`;
  nodeDomIds.set(node.id, domId);
  return domId;
}

function getLabelSegments(label: string) {
  const filterValue = String(props.filterValue ?? "").trim();
  if (!props.highlightFilter || !filterValue) {
    return [{ text: label, matched: false }];
  }

  const normalizedLabel = label.toLowerCase();
  const normalizedFilter = filterValue.toLowerCase();
  const segments: Array<{ text: string; matched: boolean }> = [];
  let startIndex = 0;
  let matchIndex = normalizedLabel.indexOf(normalizedFilter);

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      segments.push({ text: label.slice(startIndex, matchIndex), matched: false });
    }
    const endIndex = matchIndex + filterValue.length;
    segments.push({ text: label.slice(matchIndex, endIndex), matched: true });
    startIndex = endIndex;
    matchIndex = normalizedLabel.indexOf(normalizedFilter, startIndex);
  }

  if (startIndex < label.length) {
    segments.push({ text: label.slice(startIndex), matched: false });
  }

  return segments.length > 0 ? segments : [{ text: label, matched: false }];
}

function emitFilterChange() {
  emit("filter-change", {
    value: props.filterValue,
    keys: getVisibleKeys(),
    nodes: getVisibleNodes()
  });
}

watch(
  () => [props.filterValue, props.filterMethod] as const,
  () => {
    emitFilterChange();
  },
  { flush: "post" }
);

function handleCheckChange(node: TreeNode) {
  const payload = checkNode(node);
  if (!payload) {
    return;
  }

  commitSelectionChange(payload);
}

function commitSelectionChange(payload: TreeCheckChangePayload) {
  emit("update:modelValue", payload.value);
  emit("check-change", payload);
}

function setCheckedKeys(keys: TreeKey | TreeKey[], checked = true) {
  const payload = setStateCheckedKeys(keys, checked);
  if (!payload) {
    return;
  }

  commitSelectionChange(payload);
}

const exposed = {
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
  loadNode,
  retryLoad,
  scrollToKey
} satisfies UniTreeViewExposed;

defineExpose(exposed);
</script>

<style lang="scss">
@font-face {
  font-family: "uni-tree-iconfont";
  src: url('data:application/octet-stream;base64,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') format('truetype');
}
</style>

<style lang="scss" scoped>
@use "../../style/index.scss";
.uni-tree-view-container {
  width: 100%;
  height: 100%;
}
</style>