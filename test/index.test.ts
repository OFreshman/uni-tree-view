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
      extra: "root-extra",
      glyph: "R",
      blocked: false,
      nodes: [
        { value: 11, name: "Child", extra: "child-extra", glyph: "C", blocked: true }
      ]
    }
  ];
}

function createLazyTreeData(): TreeDataItem[] {
  return [
    {
      id: "lazy-root",
      label: "Lazy root",
      leaf: false
    }
  ];
}

function createLargeTreeData(rootCount = 25, childCount = 20, leafCount = 20): TreeDataItem[] {
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
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
        disabled: "blocked",
        append: "extra",
        icon: "glyph"
      }
    });

    expect(state.treeList.value.map((item) => item.id)).toEqual([1, 11]);
    expect(node(state, 11)).toMatchObject({
      label: "Child",
      append: "child-extra",
      icon: "C",
      path: ["Root", "Child"],
      disabled: true,
      parentId: 1
    });
  });

  it("supports legacy field mapping props", () => {
    const { state } = createState({
      data: createMappedTreeData(),
      field: {
        value: "value",
        label: "name",
        children: "nodes",
        disabled: "blocked"
      }
    });

    expect(state.treeList.value.map((item) => item.id)).toEqual([1, 11]);
    expect(node(state, 11)).toMatchObject({
      label: "Child",
      disabled: true
    });
  });

  it("supports split legacy field mapping props", () => {
    const { state } = createState({
      data: createMappedTreeData(),
      labelField: "name",
      valueField: "value",
      childrenField: "nodes",
      disabledField: "blocked",
      appendField: "extra",
      iconField: "glyph"
    });

    expect(state.treeList.value.map((item) => item.id)).toEqual([1, 11]);
    expect(node(state, 11)).toMatchObject({
      label: "Child",
      append: "child-extra",
      icon: "C",
      disabled: true
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
      showCheckbox: true,
      multiple: true
    });

    const payload = state.checkNode(node(state, "building-b"));

    expect(payload?.value).toEqual(["building-b", "floor-b-1", "floor-b-2"]);
    expect(checkedKeys(state)).toEqual(["building-b", "floor-b-1", "floor-b-2"]);
    expect(state.getHalfCheckedKeys()).toEqual([]);
  });

  it("updates parent half checked state from children", () => {
    const { state } = createState({
      showCheckbox: true,
      multiple: true
    });

    state.checkNode(node(state, "room-a-201"));

    expect(checkedKeys(state)).toEqual(["room-a-201"]);
    expect(state.getHalfCheckedKeys()).toEqual(["building-a", "floor-a-2"]);
    expect(node(state, "floor-a-2").checked).toBe(CHECK_STATUS_MAP.indeterminate);
    expect(node(state, "building-a").checked).toBe(CHECK_STATUS_MAP.indeterminate);
  });

  it("skips disabled nodes during user selection but keeps parent state consistent", () => {
    const { state } = createState({
      showCheckbox: true,
      multiple: true
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
      multiple: true,
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

  it("keeps selection visibility independent from single or multiple mode", () => {
    const single = createState({
      showCheckbox: true
    });

    const singlePayload = single.state.checkNode(node(single.state, "building-b"));
    expect(single.state.isMultiple.value).toBe(false);
    expect(singlePayload?.value).toBe("building-b");
    expect(checkedKeys(single.state)).toEqual(["building-b"]);
    expect(node(single.state, "floor-b-1").checked).toBe(CHECK_STATUS_MAP.unchecked);

    const multiple = createState({
      multiple: true
    });
    const multiplePayload = multiple.state.checkNode(node(multiple.state, "building-b"));
    expect(multiple.state.isMultiple.value).toBe(true);
    expect(multiplePayload?.value).toEqual(["building-b", "floor-b-1", "floor-b-2"]);
  });

  it("exposes checked node query and mutation methods", () => {
    const { state } = createState({
      showCheckbox: true,
      multiple: true
    });

    const checkedPayload = state.setCheckedKeys(["floor-b-1", "floor-b-2"]);
    expect(checkedPayload?.keys).toEqual(["building-b", "floor-b-1", "floor-b-2"]);
    expect(state.getCheckedNodes().map((item) => item.id)).toEqual(["building-b", "floor-b-1", "floor-b-2"]);
    expect(state.getUncheckedKeys()).toContain("building-a");

    const uncheckedPayload = state.setCheckedKeys(["floor-b-1"], false);
    expect(uncheckedPayload?.keys).toEqual(["floor-b-2"]);
    expect(state.getHalfCheckedKeys()).toEqual(["building-b"]);
  });

  it("filters matched branches without mutating expanded state", async () => {
    const { props, state } = createState({
      defaultExpandedKeys: ["building-a"]
    });

    props.filterValue = "201";
    await nextTick();
    expect(visibleKeys(state)).toEqual(["building-a", "floor-a-2", "room-a-201"]);
    expect(state.getVisibleKeys()).toEqual(["building-a", "floor-a-2", "room-a-201"]);
    expect(state.getExpandedKeys()).toEqual(["building-a"]);

    props.filterValue = "";
    await nextTick();
    expect(visibleKeys(state)).toEqual(["building-a", "floor-a-1", "floor-a-2", "building-b"]);
  });

  it("supports custom filter matching", async () => {
    const { props, state } = createState({
      filterMethod: (value, targetNode) => {
        return String(targetNode.source.category ?? "") === value;
      },
      data: [
        {
          id: "root",
          label: "Root",
          children: [
            { id: "active", label: "Alpha", category: "active" },
            { id: "archived", label: "Beta", category: "archived" }
          ]
        }
      ]
    });

    props.filterValue = "active";
    await nextTick();

    expect(visibleKeys(state)).toEqual(["root", "active"]);
  });

  it("returns node paths for custom display and events", () => {
    const { state } = createState();

    expect(state.getNode("room-a-201")?.label).toBe("A room 201");
    expect(state.getNodePath("room-a-201").map((item) => item.id)).toEqual([
      "building-a",
      "floor-a-2",
      "room-a-201"
    ]);
    expect(node(state, "room-a-201").path).toEqual(["A building", "A floor 2", "A room 201"]);
    expect(state.getNodePath("missing")).toEqual([]);
  });

  it("preserves runtime expanded keys across data refresh when enabled", async () => {
    const { props, state } = createState({
      cacheExpandedKeys: true
    });

    state.toggleExpand(node(state, "building-b"));
    expect(visibleKeys(state)).toEqual(["building-a", "building-b", "floor-b-1", "floor-b-2"]);

    props.data = [
      ...createTreeData(),
      { id: "building-c", label: "C building" }
    ];
    await nextTick();

    expect(node(state, "building-b").expanded).toBe(true);
    expect(visibleKeys(state)).toEqual(["building-a", "building-b", "floor-b-1", "floor-b-2", "building-c"]);
  });

  it("keeps selection state while filtering empty results", async () => {
    const { props, state } = createState({
      showCheckbox: true
    });

    state.checkNode(node(state, "room-a-201"));
    props.filterValue = "missing";
    await nextTick();

    expect(visibleKeys(state)).toEqual([]);
    expect(checkedKeys(state)).toEqual(["room-a-201"]);
  });

  it("supports lazy loading children on demand", async () => {
    const { state } = createState({
      data: createLazyTreeData(),
      loadMode: true,
      loadApi: async (targetNode) => {
        expect(targetNode.id).toBe("lazy-root");
        return [
          { id: "lazy-child", label: "Lazy child", leaf: true }
        ];
      }
    });

    const root = node(state, "lazy-root");
    expect(root.isLeaf).toBe(false);
    expect(root.loaded).toBe(false);
    expect(state.isExpandable(root)).toBe(true);

    const children = await state.loadNode(root);
    expect(children).toEqual([{ id: "lazy-child", label: "Lazy child", leaf: true }]);
    expect(root.loaded).toBe(true);
    expect(root.isLeaf).toBe(false);
    expect(state.treeList.value.map((item) => item.id)).toEqual(["lazy-root", "lazy-child"]);

    state.toggleExpand(root);
    expect(visibleKeys(state)).toEqual(["lazy-root", "lazy-child"]);
  });

  it("supports custom leaf resolver and alwaysFirstLoad", async () => {
    const { state } = createState({
      data: [
        {
          id: "static-root",
          label: "Static root",
          children: [
            { id: "stale-child", label: "Stale child" }
          ]
        },
        { id: "forced-leaf", label: "Forced leaf" }
      ],
      loadMode: true,
      alwaysFirstLoad: true,
      isLeafFn: (item) => item.id === "forced-leaf",
      loadApi: () => [
        { id: "fresh-child", label: "Fresh child", leaf: true }
      ]
    });

    const staticRoot = node(state, "static-root");
    const forcedLeaf = node(state, "forced-leaf");
    expect(staticRoot.loaded).toBe(false);
    expect(state.isExpandable(staticRoot)).toBe(true);
    expect(forcedLeaf.isLeaf).toBe(true);
    expect(state.isExpandable(forcedLeaf)).toBe(false);

    await state.loadNode(staticRoot);
    expect(state.treeList.value.map((item) => item.id)).toEqual(["static-root", "fresh-child", "forced-leaf"]);
    expect(node(state, "fresh-child").parentId).toBe("static-root");
  });

  it("keeps lazy nodes retryable after load failures", async () => {
    let attempts = 0;
    const { state } = createState({
      data: createLazyTreeData(),
      loadMode: true,
      loadApi: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("network error");
        }
        return [{ id: "lazy-child", label: "Lazy child", leaf: true }];
      }
    });

    const root = node(state, "lazy-root");
    await expect(state.loadNode(root)).rejects.toThrow("network error");
    expect(root.loading).toBe(false);
    expect(root.loaded).toBe(false);
    expect(root.loadError).toBeInstanceOf(Error);

    await expect(state.loadNode(root)).resolves.toEqual([
      { id: "lazy-child", label: "Lazy child", leaf: true }
    ]);
    expect(root.loadError).toBeNull();
    expect(root.loaded).toBe(true);
  });

  it("inherits checked state for lazy children in linked multiple mode", async () => {
    const { state } = createState({
      data: createLazyTreeData(),
      showCheckbox: true,
      multiple: true,
      loadMode: true,
      loadApi: () => [
        { id: "lazy-child", label: "Lazy child", leaf: true }
      ]
    });

    const root = node(state, "lazy-root");
    state.setCheckedKeys(["lazy-root"]);
    await state.loadNode(root);

    expect(checkedKeys(state)).toEqual(["lazy-root", "lazy-child"]);
    expect(node(state, "lazy-child").checked).toBe(CHECK_STATUS_MAP.checked);
  });

  it("ignores stale lazy responses after replacing tree data", async () => {
    const request = createDeferred<TreeDataItem[]>();
    const { props, state } = createState({
      data: createLazyTreeData(),
      loadMode: true,
      loadApi: () => request.promise
    });

    const oldRoot = node(state, "lazy-root");
    const loading = state.loadNode(oldRoot);
    props.data = [{ id: "new-root", label: "New root", leaf: true }];
    await nextTick();

    request.resolve([{ id: "late-child", label: "Late child", leaf: true }]);
    await loading;

    expect(state.treeList.value.map((item) => item.id)).toEqual(["new-root"]);
    expect(state.nodeMap.value.has("late-child")).toBe(false);
    expect(oldRoot.loading).toBe(false);
  });

  it("keeps replacement nodes clean when stale lazy requests fail", async () => {
    const request = createDeferred<TreeDataItem[]>();
    const { props, state } = createState({
      data: createLazyTreeData(),
      loadMode: true,
      loadApi: () => request.promise
    });

    const oldRoot = node(state, "lazy-root");
    const loading = state.loadNode(oldRoot);
    props.data = [{ id: "lazy-root", label: "Replacement root", leaf: false }];
    await nextTick();
    const replacementRoot = node(state, "lazy-root");

    request.reject(new Error("stale request"));
    await expect(loading).resolves.toEqual([]);

    expect(oldRoot.loadError).toBeNull();
    expect(replacementRoot.loadError).toBeNull();
    expect(replacementRoot.loading).toBe(false);
  });

  it.each([
    { multiple: true, modelValue: ["lazy-child"] },
    { multiple: false, modelValue: "lazy-child" }
  ])("applies controlled lazy child selection after loading ($multiple)", async ({ modelValue, multiple }) => {
    const { state } = createState({
      data: createLazyTreeData(),
      showCheckbox: true,
      multiple,
      modelValue,
      loadMode: true,
      loadApi: () => [{ id: "lazy-child", label: "Lazy child", leaf: true }]
    });

    expect(checkedKeys(state)).toEqual([]);
    await state.loadNode(node(state, "lazy-root"));

    expect(checkedKeys(state)).toContain("lazy-child");
    expect(node(state, "lazy-child").checked).toBe(CHECK_STATUS_MAP.checked);
  });

  it("applies unresolved default keys and updates linked parent state after lazy loading", async () => {
    const { state } = createState({
      data: createLazyTreeData(),
      showCheckbox: true,
      multiple: true,
      defaultCheckedKeys: ["lazy-child"],
      loadMode: true,
      loadApi: () => [{ id: "lazy-child", label: "Lazy child", leaf: true }]
    });

    await state.loadNode(node(state, "lazy-root"));

    expect(checkedKeys(state)).toEqual(["lazy-root", "lazy-child"]);
  });

  it("does not reapply an unchecked default key during unrelated lazy loading", async () => {
    const { state } = createState({
      data: [
        { id: "default-node", label: "Default node", leaf: true },
        ...createLazyTreeData()
      ],
      showCheckbox: true,
      multiple: true,
      checkStrictly: true,
      defaultCheckedKeys: ["default-node"],
      loadMode: true,
      loadApi: () => [{ id: "lazy-child", label: "Lazy child", leaf: true }]
    });

    state.checkNode(node(state, "default-node"));
    await state.loadNode(node(state, "lazy-root"));

    expect(checkedKeys(state)).toEqual([]);
  });

  it("preserves uncontrolled checked state across immutable data refreshes", async () => {
    const { props, state } = createState({
      showCheckbox: true,
      multiple: true,
      checkStrictly: true,
      defaultCheckedKeys: ["room-a-101"]
    });

    state.checkNode(node(state, "floor-b-1"));
    props.data = createTreeData();
    await nextTick();

    expect(checkedKeys(state)).toEqual(["room-a-101", "floor-b-1"]);

    props.data = createTreeData().filter((item) => item.id !== "building-b");
    await nextTick();
    expect(checkedKeys(state)).toEqual(["room-a-101"]);

    props.data = createTreeData();
    await nextTick();
    expect(checkedKeys(state)).toEqual(["room-a-101"]);
  });

  it("keeps controlled selection authoritative across data refreshes", async () => {
    const { props, state } = createState({
      showCheckbox: true,
      multiple: true,
      checkStrictly: true,
      modelValue: ["floor-b-1"]
    });

    state.checkNode(node(state, "room-a-101"));
    props.data = createTreeData();
    await nextTick();

    expect(checkedKeys(state)).toEqual(["floor-b-1"]);
  });

  it("preserves disabled checked nodes internally when packing excludes them", async () => {
    const { props, state } = createState({
      showCheckbox: true,
      multiple: true,
      checkStrictly: true,
      checkedDisabled: true,
      packDisabledkey: false
    });

    state.setCheckedKeys(["room-a-202"]);
    expect(checkedKeys(state)).toEqual([]);
    props.data = createTreeData();
    await nextTick();

    expect(node(state, "room-a-202").checked).toBe(CHECK_STATUS_MAP.checked);
    expect(checkedKeys(state)).toEqual([]);
  });

  it("honors checkedDisabled and packDisabledkey options", () => {
    const blocked = createState({
      showCheckbox: true
    });

    expect(blocked.state.setCheckedKeys(["room-a-202"])).toBeNull();
    expect(blocked.state.checkNode(node(blocked.state, "room-a-202"))).toBeNull();

    const allowed = createState({
      showCheckbox: true,
      checkedDisabled: true,
      packDisabledkey: false
    });

    const payload = allowed.state.setCheckedKeys(["room-a-202"]);
    expect(node(allowed.state, "room-a-202").checked).toBe(CHECK_STATUS_MAP.checked);
    expect(payload?.keys).toEqual([]);
    expect(allowed.state.getCheckedKeys()).toEqual([]);
  });

  it("does not expand a checked parent when controlled modelValue changes after selection", async () => {
    const { props, state } = createState({
      showCheckbox: true,
      multiple: true,
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

  it("keeps visible node cache and linked selection correct with large trees", () => {
    const { state } = createState({
      data: createLargeTreeData(),
      showCheckbox: true,
      multiple: true
    });

    expect(state.treeList.value).toHaveLength(10_525);
    expect(visibleKeys(state)).toHaveLength(25);

    state.expandAll();
    expect(state.visibleTreeList.value).toHaveLength(10_525);
    expect(state.getVisibleNodes()).toBe(state.visibleTreeList.value);

    const payload = state.checkNode(node(state, "province-0"));
    expect(payload?.keys).toHaveLength(421);
    expect(node(state, "province-0").checked).toBe(CHECK_STATUS_MAP.checked);
    expect(node(state, "city-0-0").checked).toBe(CHECK_STATUS_MAP.checked);
    expect(node(state, "town-0-0-0").checked).toBe(CHECK_STATUS_MAP.checked);

    state.checkNode(node(state, "town-0-0-0"));
    expect(node(state, "province-0").checked).toBe(CHECK_STATUS_MAP.indeterminate);
    expect(node(state, "city-0-0").checked).toBe(CHECK_STATUS_MAP.indeterminate);
  });
});