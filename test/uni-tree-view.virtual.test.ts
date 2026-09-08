// @vitest-environment happy-dom
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import type { UniTreeViewExposed, UniTreeViewProps } from "../packages/core/src/components/uni-tree-view/types";
import UniTreeView from "../packages/core/src/components/uni-tree-view/uni-tree-view.vue";

enableAutoUnmount(afterEach);
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mountVirtualTree(props: UniTreeViewProps = {}) {
  return mount(UniTreeView, {
    props: {
      data: Array.from({ length: 100 }, (_, id) => ({ id, label: `Node ${id}` })),
      virtual: true,
      virtualHeight: 100,
      virtualItemHeight: 20,
      virtualOverscan: 0,
      ...props
    }
  });
}

function mockScrollMeasurements() {
  const callbacks: Array<(nodes: Array<{ scrollTop: number }>) => void> = [];
  const query = {
    in: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    fields: vi.fn().mockReturnThis(),
    exec: vi.fn((callback: (nodes: Array<{ scrollTop: number }>) => void) => {
      callbacks.push(callback);
    })
  };
  const createSelectorQuery = vi.fn(() => query);
  vi.stubGlobal("uni", { createSelectorQuery });
  return { callbacks, createSelectorQuery, query };
}

function renderedLabels(wrapper: ReturnType<typeof mountVirtualTree>) {
  return wrapper.findAll(".utv-tree-node-label").map((item) => item.text());
}

describe("uni-tree-view: virtual scrolling", () => {
  it("renders the row partially visible at the bottom without overscan", async () => {
    const wrapper = mountVirtualTree();
    await wrapper.find("scroll-view").trigger("scroll", { detail: { scrollTop: 19 } });

    expect(renderedLabels(wrapper)).toEqual(["Node 0", "Node 1", "Node 2", "Node 3", "Node 4", "Node 5"]);
  });

  it("debounces measurements and stops polling once the measured offset is unchanged", async () => {
    vi.useFakeTimers();
    const { callbacks, createSelectorQuery, query } = mockScrollMeasurements();
    const wrapper = mountVirtualTree();
    const scrollView = wrapper.find("scroll-view");

    await scrollView.trigger("scroll", { detail: { scrollTop: 100 } });
    await vi.advanceTimersByTimeAsync(100);
    await scrollView.trigger("scroll", { detail: { scrollTop: 120 } });
    await vi.advanceTimersByTimeAsync(119);
    expect(createSelectorQuery).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(createSelectorQuery).toHaveBeenCalledTimes(1);
    expect(query.in).toHaveBeenCalledWith(expect.any(Object));
    expect(query.select).toHaveBeenCalledWith(".scroll-view-container");

    callbacks[0]([{ scrollTop: 800 }]);
    await nextTick();
    expect(renderedLabels(wrapper)[0]).toBe("Node 40");
    expect(scrollView.attributes("scroll-top")).toBeUndefined();

    await vi.advanceTimersByTimeAsync(120);
    expect(createSelectorQuery).toHaveBeenCalledTimes(2);
    callbacks[1]([{ scrollTop: 800 }]);
    await vi.advanceTimersByTimeAsync(240);
    expect(createSelectorQuery).toHaveBeenCalledTimes(2);
  });

  it("ignores a pending measurement after a newer scroll event", async () => {
    vi.useFakeTimers();
    const { callbacks } = mockScrollMeasurements();
    const wrapper = mountVirtualTree();
    const scrollView = wrapper.find("scroll-view");

    await scrollView.trigger("scroll", { detail: { scrollTop: 100 } });
    await vi.advanceTimersByTimeAsync(120);
    await scrollView.trigger("scroll", { detail: { scrollTop: 600 } });
    callbacks[0]([{ scrollTop: 200 }]);
    await nextTick();

    expect(renderedLabels(wrapper)[0]).toBe("Node 30");
    expect(scrollView.attributes("scroll-top")).toBeUndefined();
  });

  it("does not let a pending measurement undo scrollToKey", async () => {
    vi.useFakeTimers();
    const { callbacks } = mockScrollMeasurements();
    const wrapper = mountVirtualTree();
    const tree = wrapper.vm as unknown as UniTreeViewExposed;

    await wrapper.find("scroll-view").trigger("scroll", { detail: { scrollTop: 100 } });
    await vi.advanceTimersByTimeAsync(120);
    expect(await tree.scrollToKey(40)).toBe(true);
    callbacks[0]([{ scrollTop: 200 }]);
    await nextTick();

    expect(renderedLabels(wrapper)[0]).toBe("Node 40");
    expect(wrapper.find("scroll-view").attributes("scroll-top")).toBeUndefined();
  });

  it("restarts measurement after filtering without applying the previous list's result", async () => {
    vi.useFakeTimers();
    const { callbacks, createSelectorQuery } = mockScrollMeasurements();
    const wrapper = mountVirtualTree({ filterMethod: (_value, node) => Number(node.id) < 20 });

    await wrapper.find("scroll-view").trigger("scroll", { detail: { scrollTop: 100 } });
    await vi.advanceTimersByTimeAsync(120);
    await wrapper.setProps({ filterValue: "keep" });
    callbacks[0]([{ scrollTop: 250 }]);
    await nextTick();

    expect(renderedLabels(wrapper)[0]).toBe("Node 5");

    await vi.advanceTimersByTimeAsync(120);
    expect(createSelectorQuery).toHaveBeenCalledTimes(2);
    callbacks[1]([{ scrollTop: 200 }]);
    await nextTick();
    expect(renderedLabels(wrapper)[0]).toBe("Node 10");
    expect(wrapper.find("scroll-view").attributes("scroll-top")).toBeUndefined();
  });

  it("restarts measurement after replacing data without changing the scroll range", async () => {
    vi.useFakeTimers();
    const { callbacks, createSelectorQuery } = mockScrollMeasurements();
    const wrapper = mountVirtualTree();

    await wrapper.find("scroll-view").trigger("scroll", { detail: { scrollTop: 100 } });
    await vi.advanceTimersByTimeAsync(120);
    await wrapper.setProps({
      data: Array.from({ length: 100 }, (_, id) => ({ id, label: `Updated ${id}` }))
    });
    callbacks[0]([{ scrollTop: 800 }]);
    await nextTick();
    expect(renderedLabels(wrapper)[0]).toBe("Updated 5");

    await vi.advanceTimersByTimeAsync(120);
    expect(createSelectorQuery).toHaveBeenCalledTimes(2);
    callbacks[1]([{ scrollTop: 200 }]);
    await nextTick();
    expect(renderedLabels(wrapper)[0]).toBe("Updated 10");
  });

  it("restarts measurement when viewport dimensions change but the scroll range stays equal", async () => {
    vi.useFakeTimers();
    const { callbacks, createSelectorQuery } = mockScrollMeasurements();
    const wrapper = mountVirtualTree();

    await wrapper.find("scroll-view").trigger("scroll", { detail: { scrollTop: 100 } });
    await vi.advanceTimersByTimeAsync(120);
    // 100 * 20 - 100 与 100 * 21 - 200 的最大滚动偏移均为 1900。
    await wrapper.setProps({ virtualHeight: 200, virtualItemHeight: 21 });
    callbacks[0]([{ scrollTop: 800 }]);
    await nextTick();
    expect(renderedLabels(wrapper)[0]).toBe("Node 4");

    await vi.advanceTimersByTimeAsync(120);
    expect(createSelectorQuery).toHaveBeenCalledTimes(2);
    callbacks[1]([{ scrollTop: 210 }]);
    await nextTick();
    expect(renderedLabels(wrapper)[0]).toBe("Node 10");
  });

  it("clamps the native scroll command after filtering and does not restore the old offset", async () => {
    const wrapper = mountVirtualTree({ filterMethod: (_value, node) => Number(node.id) < 20 });
    const scrollView = wrapper.find("scroll-view");
    await scrollView.trigger("scroll", { detail: { scrollTop: 1_800 } });

    const pendingProps = wrapper.setProps({ filterValue: "keep" });
    const commands: (string | undefined)[] = [];
    for (let tick = 0; tick < 4; tick += 1) {
      await nextTick();
      commands.push(scrollView.attributes("scroll-top"));
    }
    await pendingProps;
    expect(commands).toContain("300");
    expect(scrollView.attributes("scroll-top")).toBeUndefined();
    expect(renderedLabels(wrapper)).toEqual(["Node 15", "Node 16", "Node 17", "Node 18", "Node 19"]);

    await wrapper.setProps({ filterValue: "" });
    expect(renderedLabels(wrapper)[0]).toBe("Node 15");
  });

  it("invalidates pending measurements when virtual rendering is toggled off and on", async () => {
    vi.useFakeTimers();
    const { callbacks } = mockScrollMeasurements();
    const wrapper = mountVirtualTree();

    await wrapper.find("scroll-view").trigger("scroll", { detail: { scrollTop: 100 } });
    await vi.advanceTimersByTimeAsync(120);
    await wrapper.setProps({ virtual: false });
    await wrapper.setProps({ virtual: true });
    callbacks[0]([{ scrollTop: 800 }]);
    await nextTick();

    expect(renderedLabels(wrapper)[0]).toBe("Node 5");
  });

  it("cancels delayed and in-flight measurements on unmount", async () => {
    vi.useFakeTimers();
    const { callbacks, createSelectorQuery } = mockScrollMeasurements();
    const first = mountVirtualTree();
    await first.find("scroll-view").trigger("scroll", { detail: { scrollTop: 100 } });
    first.unmount();
    await vi.advanceTimersByTimeAsync(120);
    expect(createSelectorQuery).not.toHaveBeenCalled();

    const second = mountVirtualTree();
    await second.find("scroll-view").trigger("scroll", { detail: { scrollTop: 100 } });
    await vi.advanceTimersByTimeAsync(120);
    second.unmount();
    callbacks[0]([{ scrollTop: 800 }]);
    await vi.advanceTimersByTimeAsync(240);
    expect(createSelectorQuery).toHaveBeenCalledTimes(1);
  });
});