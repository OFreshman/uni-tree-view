import { effectScope, reactive } from "vue";
import type { TreeDataItem, TreeKey } from "../../packages/core/src/components/uni-tree-view/types";
import { useTreeViewState } from "../../packages/core/src/components/uni-tree-view/useTreeViewState";
import type { TreeViewStateProps } from "../../packages/core/src/components/uni-tree-view/useTreeViewState";

const scopes: Array<ReturnType<typeof effectScope>> = [];

export function cleanupTreeViewStateScopes() {
  while (scopes.length > 0) {
    scopes.pop()?.stop();
  }
}

export function createState(options: TreeViewStateProps = {}) {
  const props = reactive<TreeViewStateProps>({
    data: createTreeData(),
    ...options
  });
  const scope = effectScope();
  const state = scope.run(() => useTreeViewState(props));
  if (!state) {
    throw new Error("Failed to create tree view state.");
  }
  scopes.push(scope);
  return { props, state };
}

export function createTreeData(): TreeDataItem[] {
  return [
    {
      id: "building-a",
      label: "A building",
      children: [
        {
          id: "floor-a-1",
          label: "A floor 1",
          children: [
            { id: "room-a-101", label: "A room 101" },
            { id: "room-a-102", label: "A room 102" }
          ]
        },
        {
          id: "floor-a-2",
          label: "A floor 2",
          children: [
            { id: "room-a-201", label: "A room 201" },
            { id: "room-a-202", label: "A room 202", disabled: true }
          ]
        }
      ]
    },
    {
      id: "building-b",
      label: "B building",
      children: [
        { id: "floor-b-1", label: "B floor 1" },
        { id: "floor-b-2", label: "B floor 2" }
      ]
    }
  ];
}

export function createMappedTreeData(): TreeDataItem[] {
  return [
    {
      value: 1,
      name: "Root",
      extra: "root-extra",
      glyph: "R",
      blocked: false,
      nodes: [
        { value: 11, name: "Child", extra: "child-extra", glyph: "C", blocked: true }
      ]
    }
  ];
}

export function createLazyTreeData(): TreeDataItem[] {
  return [
    {
      id: "lazy-root",
      label: "Lazy root",
      leaf: false
    }
  ];
}

export function createLargeTreeData(rootCount = 25, childCount = 20, leafCount = 20): TreeDataItem[] {
  return Array.from({ length: rootCount }, (_, rootIndex) => ({
    id: `province-${rootIndex}`,
    label: `Province ${rootIndex}`,
    children: Array.from({ length: childCount }, (_, childIndex) => ({
      id: `city-${rootIndex}-${childIndex}`,
      label: `City ${rootIndex}-${childIndex}`,
      children: Array.from({ length: leafCount }, (_, leafIndex) => ({
        id: `town-${rootIndex}-${childIndex}-${leafIndex}`,
        label: `Town ${rootIndex}-${childIndex}-${leafIndex}`
      }))
    }))
  }));
}

export function node(state: ReturnType<typeof useTreeViewState>, key: TreeKey) {
  const target = state.nodeMap.value.get(key);
  if (!target) {
    throw new Error(`Missing test node: ${String(key)}`);
  }
  return target;
}

export function visibleKeys(state: ReturnType<typeof useTreeViewState>) {
  return state.visibleTreeList.value.map((item) => item.id);
}

export function checkedKeys(state: ReturnType<typeof useTreeViewState>) {
  return state.getCheckedKeys();
}

export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}