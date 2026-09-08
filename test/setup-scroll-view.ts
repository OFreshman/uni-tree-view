import { config } from "@vue/test-utils";
import { defineComponent, h, watch } from "vue";
import type { UniTreeVirtualScrollEvent } from "../packages/core/src/components/uni-tree-view/useVirtualTreeList";

export interface ScrollViewTestApi {
  getScrollTop: () => number;
  getCommands: () => number[];
  moveTo: (top: number, notify?: boolean) => void;
}

// Model only uni scroll-view's prop default and command changes, not layout or inertia.
// Removing scroll-top restores 0; an unchanged prop must not undo a user's scroll.
export const ScrollViewStub = defineComponent({
  name: "ScrollView",
  inheritAttrs: false,
  props: {
    scrollTop: { type: [Number, String], default: 0 }
  },
  setup(props, { attrs, slots, expose }) {
    let nativeScrollTop = 0;
    const commands: number[] = [];
    const moveTo = (top: number, notify = true) => {
      nativeScrollTop = top;
      if (notify) {
        const onScroll = attrs.onScroll as ((event: UniTreeVirtualScrollEvent) => void) | undefined;
        onScroll?.({ detail: { scrollTop: top } });
      }
    };
    watch(() => Number(props.scrollTop), (top) => {
      nativeScrollTop = top;
      commands.push(top);
    }, { immediate: true });
    expose({
      getScrollTop: () => nativeScrollTop,
      getCommands: () => [...commands],
      moveTo
    } satisfies ScrollViewTestApi);
    return () => h("scroll-view", {
      ...attrs,
      "scroll-top": props.scrollTop,
      onScroll: (event: UniTreeVirtualScrollEvent) => moveTo(Number(event.detail?.scrollTop ?? 0))
    }, slots.default?.());
  }
});

config.global.components["scroll-view"] = ScrollViewStub;