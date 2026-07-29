// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import type { TreeCheckChangePayload, UniTreeViewExposed } from "../packages/core/src/components/uni-tree-view/types";
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