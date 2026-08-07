import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { CHECK_STATUS_MAP } from "../packages/core/src/components/uni-tree-view/constants";
import {
  checkedKeys,
  cleanupTreeViewStateScopes,
  createLargeTreeData,
  createMappedTreeData,
  createState,
  createTreeData,
  node,
  visibleKeys
} from "./helpers/treeViewState";

afterEach(cleanupTreeViewStateScopes);

describe("useTreeViewState: structure, expansion and filtering", () => {
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

  it("rebuilds nodes when treeProps mapping changes", async () => {
    const { props, state } = createState({
      data: [
        {
          id: "default-id",
          label: "Default label",
          value: "mapped-id",
          name: "Mapped label"
        }
      ],
      treeProps: {
        id: "id",
        label: "label",
        children: "children"
      }
    });

    expect(state.getNode("default-id")?.label).toBe("Default label");

    props.treeProps!.label = "name";
    await nextTick();
    expect(state.getNode("default-id")?.label).toBe("Mapped label");

    props.treeProps!.id = "value";
    await nextTick();
    expect(state.getNode("default-id")).toBeUndefined();
    expect(state.getNode("mapped-id")?.label).toBe("Mapped label");
  });

  it("expands all ancestors of default expanded keys and supports expand/collapse methods", () => {
    const { state } = createState({
      defaultExpandedKeys: ["floor-a-2"]
    });

    expect(visibleKeys(state)).toEqual(["building-a", "floor-a-1", "floor-a-2", "room-a-201", "room-a-202", "building-b"]);
    expect(state.getExpandedKeys()).toEqual(["building-a", "floor-a-2"]);

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

  it("can keep default expanded keys explicit without expanding their ancestors", async () => {
    const { props, state } = createState({
      defaultExpandedKeys: ["floor-a-2"],
      defaultExpandParent: false
    });

    expect(state.getExpandedKeys()).toEqual(["floor-a-2"]);
    expect(visibleKeys(state)).toEqual(["building-a", "building-b"]);

    props.defaultExpandParent = true;
    await nextTick();
    expect(state.getExpandedKeys()).toEqual(["building-a", "floor-a-2"]);
    expect(visibleKeys(state)).toContain("room-a-201");
  });

  it("expands checked ancestors only during initialization or expansion config changes", () => {
    const { state } = createState({
      modelValue: ["room-a-201"],
      expandChecked: true
    });

    expect(state.getExpandedKeys()).toEqual(["building-a", "floor-a-2"]);
    expect(visibleKeys(state)).toContain("room-a-201");
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

  it("does not expand a checked parent when controlled modelValue changes after selection", async () => {
    const { props, state } = createState({
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
      "room-a-201",
      "building-b",
      "floor-b-1",
      "floor-b-2"
    ]);
    expect(state.getHalfCheckedKeys()).toEqual(["building-a", "floor-a-2"]);
    expect(node(state, "room-a-202").checked).toBe(CHECK_STATUS_MAP.unchecked);
    expect(node(state, "building-b").expanded).toBe(false);
    expect(visibleKeys(state)).not.toContain("floor-b-1");
  });

  it("updates tree shape when data changes without changing expansion on model-only updates", async () => {
    const { props, state } = createState({
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