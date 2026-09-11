import { computed, shallowRef, toValue } from "vue";
import type { MaybeRefOrGetter } from "vue";

export interface UseVirtualTreeListOptions<T> {
  items: MaybeRefOrGetter<readonly T[]>;
  virtual: MaybeRefOrGetter<boolean | undefined>;
  itemHeight: MaybeRefOrGetter<number | undefined>;
  height: MaybeRefOrGetter<number | undefined>;
  overscan: MaybeRefOrGetter<number | undefined>;
}

export interface UniTreeVirtualScrollEvent {
  detail?: {
    scrollTop?: number;
  };
}

export function useVirtualTreeList<T>(options: UseVirtualTreeListOptions<T>) {
  const scrollTop = shallowRef(0);

  const itemHeight = computed(() => normalizePositiveNumber(options.itemHeight));
  const height = computed(() => normalizePositiveNumber(options.height));

  const virtualEnabled = computed(() => {
    return Boolean(toValue(options.virtual) && itemHeight.value > 0 && height.value > 0);
  });

  const overscan = computed(() => {
    const value = Number(toValue(options.overscan));
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  });

  const totalCount = computed(() => toValue(options.items).length);

  const maxScrollTop = computed(() => {
    if (!virtualEnabled.value) {
      return 0;
    }

    return Math.max(0, totalCount.value * itemHeight.value - height.value);
  });

  // 列表变短后旧的 scrollTop 可能已超出新的可滚动范围，直接拿它算下标会把窗口卡在
  // 末尾只剩一行。这里只夹紧参与计算的值而不回写 scrollTop，避免和用户滚动互相覆盖。
  const effectiveScrollTop = computed(() => {
    if (!virtualEnabled.value) {
      return 0;
    }

    return Math.min(scrollTop.value, maxScrollTop.value);
  });

  // 定高窗口：滚动位置除以行高得到首个进入视口的下标，再向前多渲染 overscan 行缓冲。
  const startIndex = computed(() => {
    if (!virtualEnabled.value || totalCount.value === 0) {
      return 0;
    }

    const rawStart = Math.floor(effectiveScrollTop.value / itemHeight.value) - overscan.value;
    return Math.min(Math.max(0, rawStart), totalCount.value - 1);
  });

  const endIndex = computed(() => {
    if (!virtualEnabled.value) {
      return totalCount.value;
    }

    // 固定多覆盖一行，补齐部分可见节点；同一行内滚动时不因余数变化重建渲染窗口。
    const visibleCount = Math.ceil(height.value / itemHeight.value) + 1 + overscan.value * 2;
    return Math.min(totalCount.value, startIndex.value + visibleCount);
  });

  const renderedItems = computed(() => {
    const items = toValue(options.items);
    if (!virtualEnabled.value) {
      return items;
    }

    return items.slice(startIndex.value, endIndex.value);
  });

  // 上下占位高度替代被跳过的行，撑出真实滚动条长度，使滚动比例与完整列表一致。
  const topPadding = computed(() => {
    return virtualEnabled.value ? startIndex.value * itemHeight.value : 0;
  });

  const bottomPadding = computed(() => {
    if (!virtualEnabled.value) {
      return 0;
    }

    return Math.max(0, (totalCount.value - endIndex.value) * itemHeight.value);
  });

  const scrollViewStyle = computed(() => {
    if (!virtualEnabled.value) {
      return undefined;
    }

    return {
      height: `${height.value}px`
    };
  });

  function handleScroll(event: UniTreeVirtualScrollEvent) {
    if (!virtualEnabled.value) {
      return;
    }

    const nextScrollTop = Number(event.detail?.scrollTop ?? 0);
    scrollTop.value = Number.isFinite(nextScrollTop) ? Math.max(0, nextScrollTop) : 0;
  }

  function scrollToIndex(index: number) {
    if (!virtualEnabled.value || totalCount.value === 0) {
      return false;
    }

    const normalizedIndex = Math.min(Math.max(0, Math.floor(index)), totalCount.value - 1);
    scrollTop.value = Math.min(normalizedIndex * itemHeight.value, maxScrollTop.value);
    return true;
  }

  // 可滚动范围缩小后旧的 scrollTop 可能已越界。这里把它拉回范围内并返回新位置，供调用方
  // 命令 scroll-view 一起归位；未越界时返回 null 表示无需干预。
  //
  // scrollTop 必须真的写回，不能只依赖 effectiveScrollTop 夹紧渲染下标：一旦范围恢复
  // （例如清空筛选词），未修正的 scrollTop 会重新生效，而真实滚动位置早已被命令到别处，
  // 两者错位同样会让可视区渲染到窗口外。
  function clampScrollTopToRange() {
    if (!virtualEnabled.value || scrollTop.value <= maxScrollTop.value) {
      return null;
    }

    scrollTop.value = maxScrollTop.value;
    return maxScrollTop.value;
  }

  // 用实测偏移补齐滞后的滚动事件，只更新窗口状态，不回写 scroll-top。
  // 即使不足半行的偏差也可能跨越行边界，因此仅在位置相同时跳过。
  function syncScrollTop(measuredScrollTop: number) {
    if (!virtualEnabled.value || !Number.isFinite(measuredScrollTop)) {
      return false;
    }

    const nextScrollTop = Math.min(Math.max(0, measuredScrollTop), maxScrollTop.value);
    if (nextScrollTop === scrollTop.value) {
      return false;
    }

    scrollTop.value = nextScrollTop;
    return true;
  }

  return {
    scrollTop,
    effectiveScrollTop,
    maxScrollTop,
    virtualEnabled,
    startIndex,
    endIndex,
    renderedItems,
    topPadding,
    bottomPadding,
    scrollViewStyle,
    handleScroll,
    scrollToIndex,
    clampScrollTopToRange,
    syncScrollTop
  };
}

function normalizePositiveNumber(value: MaybeRefOrGetter<number | undefined>) {
  const numericValue = Number(toValue(value));
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}