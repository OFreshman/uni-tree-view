import { describe, expect, it } from "vitest";
import { computed, effectScope, shallowRef } from "vue";
import { useVirtualTreeList } from "../packages/core/src/components/uni-tree-view/useVirtualTreeList";

describe("useVirtualTreeList", () => {
  it("renders all items when virtual rendering is disabled", () => {
    const scope = effectScope();
    const result = scope.run(() => {
      return useVirtualTreeList({
        items: shallowRef([1, 2, 3]),
        virtual: false,
        itemHeight: 36,
        height: 72,
        overscan: 1
      });
    });

    expect(result).toBeTruthy();
    expect(result!.virtualEnabled.value).toBe(false);
    expect(result!.renderedItems.value).toEqual([1, 2, 3]);
    expect(result!.scrollViewStyle.value).toBeUndefined();

    scope.stop();
  });

  it("calculates the rendered window from scroll-view scrollTop", () => {
    const scope = effectScope();
    const items = shallowRef(Array.from({ length: 100 }, (_, index) => index));
    const result = scope.run(() => {
      return useVirtualTreeList({
        items,
        virtual: true,
        itemHeight: 20,
        height: 100,
        overscan: 2
      });
    });

    expect(result).toBeTruthy();
    expect(result!.virtualEnabled.value).toBe(true);
    expect(result!.startIndex.value).toBe(0);
    expect(result!.endIndex.value).toBe(9);
    expect(result!.renderedItems.value).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(result!.topPadding.value).toBe(0);
    expect(result!.bottomPadding.value).toBe(1820);
    expect(result!.scrollViewStyle.value).toEqual({ height: "100px" });

    result!.handleScroll({ detail: { scrollTop: 240 } });

    expect(result!.startIndex.value).toBe(10);
    expect(result!.endIndex.value).toBe(19);
    expect(result!.renderedItems.value).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18]);
    expect(result!.topPadding.value).toBe(200);
    expect(result!.bottomPadding.value).toBe(1620);

    scope.stop();
  });

  it("clamps invalid scroll positions and reacts to list size changes", () => {
    const scope = effectScope();
    const items = shallowRef(Array.from({ length: 10 }, (_, index) => index));
    const result = scope.run(() => {
      return useVirtualTreeList({
        items,
        virtual: true,
        itemHeight: 10,
        height: 30,
        overscan: 1
      });
    });

    expect(result).toBeTruthy();
    result!.handleScroll({ detail: { scrollTop: -100 } });
    expect(result!.scrollTop.value).toBe(0);
    expect(result!.startIndex.value).toBe(0);

    result!.handleScroll({ detail: { scrollTop: Number.NaN } });
    expect(result!.scrollTop.value).toBe(0);

    result!.handleScroll({ detail: { scrollTop: 1_000 } });
    expect(result!.startIndex.value).toBe(9);
    expect(result!.endIndex.value).toBe(10);

    items.value = [0, 1, 2];
    expect(result!.startIndex.value).toBe(2);
    expect(result!.endIndex.value).toBe(3);
    expect(result!.renderedItems.value).toEqual([2]);

    scope.stop();
  });

  it("keeps virtual rendering disabled for invalid size options", () => {
    const scope = effectScope();
    const itemHeight = shallowRef(0);
    const height = shallowRef(100);
    const result = scope.run(() => {
      return useVirtualTreeList({
        items: shallowRef([1, 2, 3]),
        virtual: true,
        itemHeight,
        height: computed(() => height.value),
        overscan: -1
      });
    });

    expect(result).toBeTruthy();
    expect(result!.virtualEnabled.value).toBe(false);

    itemHeight.value = 20;
    expect(result!.virtualEnabled.value).toBe(true);
    expect(result!.endIndex.value).toBe(3);

    scope.stop();
  });
});