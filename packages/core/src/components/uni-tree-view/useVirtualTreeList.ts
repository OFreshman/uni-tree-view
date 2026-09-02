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

    const visibleCount = Math.ceil(height.value / itemHeight.value) + overscan.value * 2;
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
    scrollTop.value = normalizedIndex * itemHeight.value;
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

  // 用实测滚动位置校正 JS 侧的 scrollTop。
  //
  // 小程序的 @scroll 是节流上报的：快速甩动时逻辑层拿到的位置严重滞后，而惯性停下的那一刻
  // 不保证还有事件到达。一旦最后一个位置没能上报，JS 侧就永久停在滞后值上，渲染窗口落在
  // 真实视口之外，可视区只剩占位块——表现为「滑动后一直空白，重新触一下才渲染」（触摸会
  // 产生新的滚动事件，把窗口重新算对，所以看起来是碰一下就自愈）。
  //
  // 这里只读真实位置并更新 JS 状态，不回写 scroll-top，因此不会与用户滚动互相拉扯。
  // 阈值取半行：不足半行的偏差不会改变任何渲染下标，重算只是白费一次 setData。
  function syncScrollTop(measuredScrollTop: number) {
    if (!virtualEnabled.value || !Number.isFinite(measuredScrollTop)) {
      return false;
    }

    const nextScrollTop = Math.min(Math.max(0, measuredScrollTop), maxScrollTop.value);
    if (Math.abs(nextScrollTop - scrollTop.value) < itemHeight.value / 2) {
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