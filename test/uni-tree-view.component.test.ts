// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import type {
  TreeCheckChangePayload,
  TreeExpandPayload,
  TreeFilterPayload,
  TreeLoadErrorPayload,
  TreeLoadPayload,
  TreeNodeClickPayload,
  UniTreeViewExposed
} from "../packages/core/src/components/uni-tree-view/types";
import UniTreeView from "../packages/core/src/components/uni-tree-view/uni-tree-view.vue";

const treeData = [
  {
    id: "root",
    label: "Alpha root",
    children: [
      { id: "child", label: "Alpha child" }
    ]
  }
];

function exposed(wrapper: ReturnType<typeof mount>) {
  return wrapper.vm as unknown as UniTreeViewExposed;
}

describe("uni-tree-view component", () => {
  it("exposes the public methods and emits complete selection payloads", async () => {
    const wrapper = mount(UniTreeView, {
      props: {
        data: treeData,
        defaultExpandAll: true,
        multiple: true,
        selectable: true
      }
    });
    const tree = exposed(wrapper);

    expect([
      "setCheckedKeys",
      "getCheckedKeys",
      "getHalfCheckedKeys",
      "getUncheckedKeys",
      "getCheckedNodes",
      "getHalfCheckedNodes",
      "getUncheckedNodes",
      "setExpandedKeys",
      "getExpandedKeys",
      "getUnexpandedKeys",
      "getVisibleKeys",
      "getExpandedNodes",
      "getUnexpandedNodes",
      "getVisibleNodes",
      "getNode",
      "getNodePath",
      "expandAll",
      "collapseAll",
      "loadNode",
      "retryLoad",
      "scrollToKey"
    ].every((method) => typeof tree[method as keyof UniTreeViewExposed] === "function")).toBe(true);

    tree.setCheckedKeys("child");
    await nextTick();

    const payload = wrapper.emitted<TreeCheckChangePayload[]>("check-change")?.[0]?.[0];
    expect(tree.getCheckedKeys()).toEqual(["root", "child"]);
    expect(payload).toMatchObject({
      value: ["root", "child"],
      keys: ["root", "child"],
      node: { id: "child" }
    });
    expect(payload?.nodes.map((node) => node.id)).toEqual(["root", "child"]);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([["root", "child"]]);
  });

  it("emits selection and node-click payloads through the row interaction chain", async () => {
    const wrapper = mount(UniTreeView, {
      props: {
        data: treeData,
        defaultExpandAll: true,
        multiple: true,
        selectable: true,
        checkOnClickNode: true
      }
    });

    await wrapper.findAll(".utv-tree-item")[1].trigger("click");

    const checkPayload = wrapper.emitted<TreeCheckChangePayload[]>("check-change")?.[0]?.[0];
    const clickPayload = wrapper.emitted<TreeNodeClickPayload[]>("node-click")?.[0]?.[0];
    expect(checkPayload).toMatchObject({
      value: ["root", "child"],
      keys: ["root", "child"],
      node: { id: "child" }
    });
    expect(checkPayload?.nodes.map((node) => node.id)).toEqual(["root", "child"]);
    expect(clickPayload).toMatchObject({
      id: "child",
      node: { id: "child" }
    });
    expect(clickPayload?.path.map((node) => node.id)).toEqual(["root", "child"]);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([["root", "child"]]);
  });

  it("emits expand-change payloads from the arrow interaction", async () => {
    const wrapper = mount(UniTreeView, {
      props: {
        data: treeData
      }
    });

    await wrapper.find(".utv-tree-item__arrow-icon").trigger("click");

    const firstPayload = wrapper.emitted<TreeExpandPayload[]>("expand-change")?.[0]?.[0];
    expect(firstPayload).toMatchObject({
      expanded: true,
      node: { id: "root" }
    });
    expect(wrapper.findAll(".utv-tree-item")).toHaveLength(2);

    await wrapper.find(".utv-tree-item__arrow-icon").trigger("click");
    const secondPayload = wrapper.emitted<TreeExpandPayload[]>("expand-change")?.[1]?.[0];
    expect(secondPayload).toMatchObject({
      expanded: false,
      node: { id: "root" }
    });
  });

  it("emits filter-change with the filtered visible nodes", async () => {
    const wrapper = mount(UniTreeView, {
      props: {
        data: treeData
      }
    });

    await wrapper.setProps({ filterValue: "child" });
    await nextTick();

    const filterEvents = wrapper.emitted<TreeFilterPayload[]>("filter-change") ?? [];
    const payload = filterEvents[filterEvents.length - 1]?.[0];
    expect(payload).toMatchObject({
      value: "child",
      keys: ["root", "child"]
    });
    expect(payload?.nodes.map((node) => node.id)).toEqual(["root", "child"]);
  });

  it("emits load payloads after lazy children resolve", async () => {
    const wrapper = mount(UniTreeView, {
      props: {
        data: [{ id: "lazy-root", label: "Lazy root", leaf: false }],
        loadMode: true,
        loadApi: async () => [{ id: "lazy-child", label: "Lazy child", leaf: true }]
      }
    });

    await wrapper.find(".utv-tree-item__arrow-icon").trigger("click");
    await flushPromises();

    const payload = wrapper.emitted<TreeLoadPayload[]>("load")?.[0]?.[0];
    expect(payload).toMatchObject({
      node: { id: "lazy-root" },
      children: [{ id: "lazy-child", label: "Lazy child", leaf: true }]
    });
    expect(wrapper.text()).toContain("Lazy child");
  });

  it("emits load-error payloads and keeps failed lazy nodes retryable", async () => {
    const loadError = new Error("lazy load failed");
    const wrapper = mount(UniTreeView, {
      props: {
        data: [{ id: "lazy-root", label: "Lazy root", leaf: false }],
        loadMode: true,
        loadApi: () => Promise.reject(loadError)
      }
    });

    await wrapper.find(".utv-tree-item__arrow-icon").trigger("click");
    await flushPromises();

    const payload = wrapper.emitted<TreeLoadErrorPayload[]>("load-error")?.[0]?.[0];
    expect(payload?.node).toMatchObject({
      id: "lazy-root",
      loadError
    });
    expect(payload?.error).toBe(loadError);
    expect(wrapper.find(".utv-tree-item__arrow-icon").classes()).toContain("is-load-error");
  });

  it("uses BEM element classes with conventional state classes", () => {
    const wrapper = mount(UniTreeView, {
      props: {
        data: [{ id: "disabled", label: "Disabled", disabled: true }],
        multiple: true,
        selectable: true
      }
    });
    const row = wrapper.find(".utv-tree-item");
    const checkbox = row.find(".utv-tree-item__checkbox");

    expect(row.classes()).toEqual(expect.arrayContaining(["is-disabled", "is-leaf"]));
    expect(row.find(".utv-tree-item__arrow-placeholder").exists()).toBe(true);
    expect(checkbox.classes()).toContain("is-disabled");
    expect(row.find(".utv-tree-item__checkbox-icon").exists()).toBe(true);
    expect(wrapper.find(".is--disabled").exists()).toBe(false);
  });

  it("passes node paths to slots and renders all filter matches", () => {
    const wrapper = mount(UniTreeView, {
      props: {
        data: treeData,
        defaultExpandAll: true,
        filterValue: "alpha"
      },
      slots: {
        append: ({ node, path }) => `${node.id}:${path.map((item: { label: string }) => item.label).join(">")}`
      }
    });

    expect(wrapper.text()).toContain("child:Alpha root>Alpha child");
    expect(wrapper.findAll(".utv-tree-node-label__match")).toHaveLength(2);
  });

  it("adds nodeClass to rows while preserving the standard root class", () => {
    const wrapper = mount(UniTreeView, {
      props: {
        data: [
          { id: "first", label: "First" },
          { id: "second", label: "Second" }
        ],
        nodeClass: "consumer-tree-node emphasized"
      },
      attrs: {
        class: "consumer-tree"
      }
    });

    expect(wrapper.classes()).toContain("consumer-tree");
    for (const row of wrapper.findAll(".utv-tree-item")) {
      expect(row.classes()).toEqual(
        expect.arrayContaining(["consumer-tree-node", "emphasized"])
      );
    }
  });

  it("uses stable collision-free DOM ids and scroll commands in virtual mode", async () => {
    const wrapper = mount(UniTreeView, {
      props: {
        data: [
          { id: "Aa", label: "First" },
          { id: "BB", label: "Second" }
        ],
        virtual: true,
        virtualHeight: 72,
        virtualItemHeight: 36
      }
    });
    const ids = wrapper.findAll(".utv-tree-item").map((item) => item.attributes("id"));

    expect(new Set(ids).size).toBe(2);

    await wrapper.find("scroll-view").trigger("scroll", { detail: { scrollTop: 36 } });
    expect(wrapper.find("scroll-view").attributes("scroll-top")).toBeUndefined();

    expect(await exposed(wrapper).scrollToKey("BB")).toBe(true);
    await nextTick();
    expect(wrapper.find("scroll-view").attributes("scroll-top")).toBe("36");
  });
});