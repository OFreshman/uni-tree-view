// @vitest-environment happy-dom
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import type { UniTreeViewExposed, UniTreeViewProps } from "../packages/core/src/components/uni-tree-view/types";
import UniTreeView from "../packages/core/src/components/uni-tree-view/uni-tree-view.vue";
import { ScrollViewStub } from "./setup-scroll-view";
import type { ScrollViewTestApi } from "./setup-scroll-view";

enableAutoUnmount(afterEach);
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mountVirtualTree(props: UniTreeViewProps = {}, globalProperties: Record<string, unknown> = {}) {
  return mount(UniTreeView, {
    global: { config: { globalProperties } },
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

function nativeScroll(wrapper: ReturnType<typeof mountVirtualTree>) {
  return wrapper.getComponent(ScrollViewStub).vm.$.exposed as ScrollViewTestApi;
}

function renderedLabels(wrapper: ReturnType<typeof mountVirtualTree>) {
  return wrapper.findAll(".utv-tree-node-label").map((item) => item.text());
}

describe("uni-tree-view: virtual scrolling", () => {
  it("models scroll-view resetting an undefined scroll-top to its default", async () => {
    const wrapper = mount(ScrollViewStub, { props: { scrollTop: 800 } });
    const native = wrapper.vm as unknown as ScrollViewTestApi;
    expect(native.getScrollTop()).toBe(800);
    await wrapper.setProps({ scrollTop: undefined });
    expect(native.getScrollTop()).toBe(0);
  });

  it.each([[0, 0], [40, 800], [99, 1_900]])("keeps the native position after locating key %s", async (key, top) => {
    const wrapper = mountVirtualTree();
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    expect(await tree.scrollToKey(key)).toBe(true);
    await nextTick();
    expect(nativeScroll(wrapper).getScrollTop()).toBe(top);
    expect(renderedLabels(wrapper)).toContain(`Node ${key}`);
  });

  it.each([[0, 0], [40, 800], [99, 1_900]])("reissues the same key %s even if native scroll events were missed", async (key, top) => {
    const wrapper = mountVirtualTree();
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    const native = nativeScroll(wrapper);
    await tree.scrollToKey(key);
    native.moveTo(600, false);
    expect(await tree.scrollToKey(key)).toBe(true);
    await nextTick();
    expect(native.getScrollTop()).toBe(top);
  });

  it("does not pull user scrolling back to a retained command on rerender", async () => {
    const wrapper = mountVirtualTree();
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    const native = nativeScroll(wrapper);
    await tree.scrollToKey(40);
    const commands = native.getCommands();
    native.moveTo(620);
    await wrapper.setProps({ themeColor: "#112233" });
    expect(native.getScrollTop()).toBe(620);
    expect(native.getCommands()).toEqual(commands);
    expect(renderedLabels(wrapper)[0]).toBe("Node 31");
  });

  it.each([40, 60])("lets the latest concurrent command locate key %s", async (key) => {
    const wrapper = mountVirtualTree();
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    await tree.scrollToKey(40);
    nativeScroll(wrapper).moveTo(600, false);
    await Promise.all([tree.scrollToKey(40), tree.scrollToKey(key)]);
    await nextTick();
    expect(nativeScroll(wrapper).getScrollTop()).toBe(key * 20);
    expect(renderedLabels(wrapper)[0]).toBe(`Node ${key}`);
  });

  it("can locate the top before any explicit command after user scrolling", async () => {
    const wrapper = mountVirtualTree();
    nativeScroll(wrapper).moveTo(600);
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    expect(await tree.scrollToKey(0)).toBe(true);
    expect(nativeScroll(wrapper).getScrollTop()).toBe(0);
  });

  it("abandons an in-flight repeated command when virtual mode is disabled", async () => {
    const wrapper = mountVirtualTree();
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    await tree.scrollToKey(40);
    const pending = tree.scrollToKey(40);
    await nextTick();
    await wrapper.setProps({ virtual: false });
    await pending;
    await flushPromises();
    expect(nativeScroll(wrapper).getScrollTop()).toBe(0);
    expect(renderedLabels(wrapper)).toHaveLength(100);
  });

  it("does not replay a retained command after virtual mode is re-enabled", async () => {
    const wrapper = mountVirtualTree();
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    const native = nativeScroll(wrapper);
    await tree.scrollToKey(40);
    native.moveTo(600);
    await wrapper.setProps({ virtual: false });
    expect(native.getScrollTop()).toBe(0);
    const commands = native.getCommands();
    await wrapper.setProps({ virtual: true });
    expect(native.getScrollTop()).toBe(0);
    expect(native.getCommands()).toEqual(commands);
    expect(await tree.scrollToKey(40)).toBe(true);
    expect(native.getScrollTop()).toBe(800);
  });

  it("abandons an in-flight repeated command on unmount", async () => {
    const wrapper = mountVirtualTree();
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    const native = nativeScroll(wrapper);
    await tree.scrollToKey(40);
    const pending = tree.scrollToKey(40);
    await nextTick();
    wrapper.unmount();
    const commands = native.getCommands();
    await pending;
    expect(native.getCommands()).toEqual(commands);
  });

  it("uses distinct selectors for two instances even when query.in is a no-op", async () => {
    vi.useFakeTimers();
    const { callbacks, query } = mockScrollMeasurements();
    const first = mountVirtualTree();
    const second = mountVirtualTree();
    const ids = [first, second].map((wrapper) => wrapper.find("scroll-view").attributes("id"));
    expect(ids.every((id) => Boolean(id))).toBe(true);
    expect(new Set(ids).size).toBe(2);
    nativeScroll(first).moveTo(100);
    nativeScroll(second).moveTo(200);
    await vi.advanceTimersByTimeAsync(120);
    expect(query.select.mock.calls.map(([selector]) => selector)).toEqual(ids.map((id) => `#${id}`));
    callbacks[0]([{ scrollTop: 400 }]);
    callbacks[1]([{ scrollTop: 800 }]);
    await nextTick();
    expect(renderedLabels(first)[0]).toBe("Node 20");
    expect(renderedLabels(second)[0]).toBe("Node 40");
  });

  it("passes the native component scope to an Alipay query when available", async () => {
    vi.useFakeTimers();
    const { query } = mockScrollMeasurements();
    const nativeScope = { nativeComponent: true };
    const wrapper = mountVirtualTree({}, { $scope: nativeScope });
    nativeScroll(wrapper).moveTo(100);
    await vi.advanceTimersByTimeAsync(120);
    expect(query.in.mock.calls[0][0]).toBe(nativeScope);
  });

  it.each([3, 5])("skips measurement for %s rows that cannot scroll and resets stale event offsets", async (count) => {
    vi.useFakeTimers();
    const { createSelectorQuery } = mockScrollMeasurements();
    const wrapper = mountVirtualTree({
      data: Array.from({ length: count }, (_, id) => ({ id, label: `Node ${id}` }))
    });
    await wrapper.find("scroll-view").trigger("scroll", { detail: { scrollTop: 40 } });
    await vi.advanceTimersByTimeAsync(240);
    expect(createSelectorQuery).not.toHaveBeenCalled();

    await wrapper.setProps({
      data: Array.from({ length: 100 }, (_, id) => ({ id, label: `Node ${id}` }))
    });
    expect(renderedLabels(wrapper)[0]).toBe("Node 0");
    await vi.advanceTimersByTimeAsync(120);
    expect(createSelectorQuery).toHaveBeenCalledTimes(1);
  });

  it("clears stale offsets when virtual mode is re-enabled with a non-scrollable list", async () => {
    vi.useFakeTimers();
    const { createSelectorQuery } = mockScrollMeasurements();
    const wrapper = mountVirtualTree();
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    await tree.scrollToKey(40);
    await wrapper.setProps({ virtual: false });
    await wrapper.setProps({ data: [{ id: 0, label: "Node 0" }] });
    await wrapper.setProps({ virtual: true });
    await vi.advanceTimersByTimeAsync(240);
    expect(createSelectorQuery).not.toHaveBeenCalled();

    await wrapper.setProps({
      data: Array.from({ length: 100 }, (_, id) => ({ id, label: `Node ${id}` }))
    });
    expect(renderedLabels(wrapper)[0]).toBe("Node 0");
    expect(nativeScroll(wrapper).getScrollTop()).toBe(0);
  });

  it.each(["filter", "viewport"] as const)("cancels measurements at zero scroll range after a %s change and resumes on growth", async (change) => {
    vi.useFakeTimers();
    const { callbacks, createSelectorQuery } = mockScrollMeasurements();
    const wrapper = mountVirtualTree({ filterMethod: (_value, node) => Number(node.id) < 3 });
    const tree = wrapper.vm as unknown as UniTreeViewExposed;
    expect(await tree.scrollToKey(40)).toBe(true);
    await vi.advanceTimersByTimeAsync(120);
    expect(createSelectorQuery).toHaveBeenCalledTimes(1);

    await wrapper.setProps(change === "filter" ? { filterValue: "keep" } : { virtualHeight: 2_000 });
    await flushPromises();
    expect(nativeScroll(wrapper).getScrollTop()).toBe(0);
    callbacks[0]([{ scrollTop: 800 }]);
    await vi.advanceTimersByTimeAsync(240);
    expect(createSelectorQuery).toHaveBeenCalledTimes(1);
    expect(renderedLabels(wrapper)[0]).toBe("Node 0");

    await wrapper.setProps(change === "filter" ? { filterValue: "" } : { virtualHeight: 100 });
    expect(nativeScroll(wrapper).getScrollTop()).toBe(0);
    expect(renderedLabels(wrapper)[0]).toBe("Node 0");
    await vi.advanceTimersByTimeAsync(120);
    expect(createSelectorQuery).toHaveBeenCalledTimes(2);
  });

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
    expect(query.in.mock.calls[0][0]).toBe(wrapper.vm.$.proxy);
    expect(query.select).toHaveBeenCalledWith(`#${scrollView.attributes("id")}`);

    callbacks[0]([{ scrollTop: 800 }]);
    await nextTick();
    expect(renderedLabels(wrapper)[0]).toBe("Node 40");
    expect(scrollView.attributes("scroll-top")).toBe("0");

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
    expect(scrollView.attributes("scroll-top")).toBe("0");
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
    expect(nativeScroll(wrapper).getScrollTop()).toBe(800);
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
    expect(wrapper.find("scroll-view").attributes("scroll-top")).toBe("0");
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

    await wrapper.setProps({ filterValue: "keep" });
    await flushPromises();
    expect(nativeScroll(wrapper).getScrollTop()).toBe(300);
    expect(scrollView.attributes("scroll-top")).toBe("300");
    expect(renderedLabels(wrapper)).toEqual(["Node 15", "Node 16", "Node 17", "Node 18", "Node 19"]);

    await wrapper.setProps({ filterValue: "" });
    expect(nativeScroll(wrapper).getScrollTop()).toBe(300);
    expect(renderedLabels(wrapper)[0]).toBe("Node 15");

    // A second shrink must reissue 300 even though the previous command is unchanged.
    nativeScroll(wrapper).moveTo(1_800);
    await wrapper.setProps({ filterValue: "keep" });
    await flushPromises();
    expect(nativeScroll(wrapper).getScrollTop()).toBe(300);
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