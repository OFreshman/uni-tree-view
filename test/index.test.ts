import { afterEach, describe, expect, it } from "vitest";
import { effectScope, nextTick, reactive } from "vue";
import { CHECK_STATUS_MAP } from "../packages/core/src/components/uni-tree-view/constants";
import type { TreeDataItem, TreeKey } from "../packages/core/src/components/uni-tree-view/types";
import { useTreeViewState } from "../packages/core/src/components/uni-tree-view/useTreeViewState";
import type { TreeViewStateProps } from "../packages/core/src/components/uni-tree-view/useTreeViewState";

const scopes: Array<ReturnType<typeof effectScope>> = [];

afterEach(() => {
  while (scopes.length > 0) {
    scopes.pop()?.stop();
  }
});

function createState(options: TreeViewStateProps = {}) {
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

function createTreeData(): TreeDataItem[] {
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

function createMappedTreeData(): TreeDataItem[] {
  return [
    {
      value: 1,
      name: "Root",
      blocked: false,
      nodes: [
        { value: 11, name: "Child", blocked: true }
      ]
    }
  ];
}

function node(state: ReturnType<typeof useTreeViewState>, key: TreeKey) {
  const target = state.nodeMap.value.get(key);
  if (!target) {
    throw new Error(`Missing test node: ${String(key)}`);
  }
  return target;
}

function visibleKeys(state: ReturnType<typeof useTreeViewState>) {
  return state.visibleTreeList.value.map((item) => item.id);
}

function checkedKeys(state: ReturnType<typeof useTreeViewState>) {
  return state.getCheckedKeys();
}

describe("useTreeViewState", () => {
  it("flattens tree data and shows only root nodes initially", () => {
    const { state } = createState();

    expect(state.treeList.value).toHaveLength(10);
    expect(visibleKeys(state)).toEqual(["building-a", "building-b"]);
    expect(node(state, "room-a-201")).toMatchObject({
      id: "room-a-201",
      label: "A room 201",
      level: 2,
      parentId: "floor-a-2",
      parentIds: ["building-a", "floor-a-2"],
      isLeaf: true
    });
  });

  it("supports custom treeProps mapping", () => {
    const { state } = createState({
      data: createMappedTreeData(),
      treeProps: {
        id: "value",
        label: "name",
        children: "nodes",
        disabled: "blocked"
      }
    });

    expect(state.treeList.value.map((item) => item.id)).toEqual([1, 11]);
    expect(node(state, 11)).toMatchObject({
      label: "Child",
      disabled: true,
      parentId: 1
    });
  });

  it("applies default expanded keys and expand/collapse methods", () => {
    const { state } = createState({
      defaultExpandedKeys: ["building-a"]
    });

    expect(visibleKeys(state)).toEqual(["building-a", "floor-a-1", "floor-a-2", "building-b"]);
    expect(state.getExpandedKeys()).toEqual(["building-a"]);

    state.setExpandedKeys(["floor-a-2"], true);
    expect(visibleKeys(state)).toEqual([
      "building-a",
      "floor-a-1",
      "floor-a-2",
      "room-a-201",
      "room-a-202",
      "building-b"
    ]);

    state.collapseAll();
    expect(visibleKeys(state)).toEqual(["building-a", "building-b"]);
    expect(state.getExpandedKeys()).toEqual([]);

    state.expandAll();
    expect(state.getExpandedKeys()).toEqual(["building-a", "floor-a-1", "floor-a-2", "building-b"]);
  });

  it("expands checked ancestors only during initialization or expansion config changes", () => {
    const { state } = createState({
      showCheckbox: true,
      modelValue: ["room-a-201"],
      expandChecked: true
    });

    expect(state.getExpandedKeys()).toEqual(["building-a", "floor-a-2"]);
    expect(visibleKeys(state)).toContain("room-a-201");
  });

  it("selects a parent and descendants in linked multiple mode", () => {
    const { state } = createState({
      showCheckbox: true
    });

    const payload = state.checkNode(node(state, "building-b"));

    expect(payload?.value).toEqual(["building-b", "floor-b-1", "floor-b-2"]);
    expect(checkedKeys(state)).toEqual(["building-b", "floor-b-1", "floor-b-2"]);
    expect(state.getHalfCheckedKeys()).toEqual([]);
  });

  it("updates parent half checked state from children", () => {
    const { state } = createState({
      showCheckbox: true
    });

    state.checkNode(node(state, "room-a-201"));

    expect(checkedKeys(state)).toEqual(["room-a-201"]);
    expect(state.getHalfCheckedKeys()).toEqual(["building-a", "floor-a-2"]);
    expect(node(state, "floor-a-2").checked).toBe(CHECK_STATUS_MAP.indeterminate);
    expect(node(state, "building-a").checked).toBe(CHECK_STATUS_MAP.indeterminate);
  });

  it("skips disabled nodes during user selection but keeps parent state consistent", () => {
    const { state } = createState({
      showCheckbox: true
    });

    const disabledPayload = state.checkNode(node(state, "room-a-202"));
    expect(disabledPayload).toBeNull();
    expect(checkedKeys(state)).toEqual([]);

    state.checkNode(node(state, "floor-a-2"));
    expect(checkedKeys(state)).toEqual(["room-a-201"]);
    expect(state.getHalfCheckedKeys()).toEqual(["building-a", "floor-a-2"]);
    expect(node(state, "room-a-202").checked).toBe(CHECK_STATUS_MAP.unchecked);
  });

  it("keeps parent and children independent in checkStrictly mode", () => {
    const { state } = createState({
      showCheckbox: true,
      checkStrictly: true
    });

    state.checkNode(node(state, "building-a"));

    expect(checkedKeys(state)).toEqual(["building-a"]);
    expect(state.getHalfCheckedKeys()).toEqual([]);
    expect(node(state, "floor-a-1").checked).toBe(CHECK_STATUS_MAP.unchecked);
  });

  it("supports single selection and onlyRadioLeaf", () => {
    const { state } = createState({
      onlyRadioLeaf: true
    });

    expect(state.checkNode(node(state, "building-a"))).toBeNull();

    const firstPayload = state.checkNode(node(state, "room-a-101"));
    expect(firstPayload?.value).toBe("room-a-101");
    expect(checkedKeys(state)).toEqual(["room-a-101"]);

    const secondPayload = state.checkNode(node(state, "room-a-102"));
    expect(secondPayload?.value).toBe("room-a-102");
    expect(checkedKeys(state)).toEqual(["room-a-102"]);

    const uncheckedPayload = state.checkNode(node(state, "room-a-102"));
    expect(uncheckedPayload?.value).toBeNull();
    expect(checkedKeys(state)).toEqual([]);
  });

  it("exposes checked node query and mutation methods", () => {
    const { state } = createState({
      showCheckbox: true
    });

    const checkedPayload = state.setCheckedKeys(["floor-b-1", "floor-b-2"]);
    expect(checkedPayload?.keys).toEqual(["building-b", "floor-b-1", "floor-b-2"]);
    expect(state.getCheckedNodes().map((item) => item.id)).toEqual(["building-b", "floor-b-1", "floor-b-2"]);
    expect(state.getUncheckedKeys()).toContain("building-a");

    const uncheckedPayload = state.setCheckedKeys(["floor-b-1"], false);
    expect(uncheckedPayload?.keys).toEqual(["floor-b-2"]);
    expect(state.getHalfCheckedKeys()).toEqual(["building-b"]);
  });

  it("does not expand a checked parent when controlled modelValue changes after selection", async () => {
    const { props, state } = createState({
      showCheckbox: true,
      modelValue: ["floor-a-2"],
      defaultExpandedKeys: ["building-a"],
      expandChecked: true
    });

    expect(node(state, "building-b").expanded).toBe(false);
    expect(visibleKeys(state)).not.toContain("floor-b-1");

    const payload = state.checkNode(node(state, "building-b"));
    props.modelValue = payload?.value ?? null;
    await nextTick();

    expect(checkedKeys(state)).toEqual([
      "floor-a-2",
      "room-a-201",
      "room-a-202",
      "building-b",
      "floor-b-1",
      "floor-b-2"
    ]);
    expect(node(state, "building-b").expanded).toBe(false);
    expect(visibleKeys(state)).not.toContain("floor-b-1");
  });

  it("updates tree shape when data changes without changing expansion on model-only updates", async () => {
    const { props, state } = createState({
      showCheckbox: true,
      defaultExpandedKeys: ["building-a"]
    });

    expect(visibleKeys(state)).toEqual(["building-a", "floor-a-1", "floor-a-2", "building-b"]);

    props.modelValue = ["building-b"];
    await nextTick();
    expect(visibleKeys(state)).toEqual(["building-a", "floor-a-1", "floor-a-2", "building-b"]);

    props.data = [
      ...createTreeData(),
      { id: "building-c", label: "C building" }
    ];
    await nextTick();
    expect(visibleKeys(state)).toEqual(["building-a", "floor-a-1", "floor-a-2", "building-b", "building-c"]);
  });
});