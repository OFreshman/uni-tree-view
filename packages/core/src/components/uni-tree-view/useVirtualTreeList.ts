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

  const startIndex = computed(() => {
    if (!virtualEnabled.value || totalCount.value === 0) {
      return 0;
    }

    const rawStart = Math.floor(scrollTop.value / itemHeight.value) - overscan.value;
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

  return {
    scrollTop,
    virtualEnabled,
    startIndex,
    endIndex,
    renderedItems,
    topPadding,
    bottomPadding,
    scrollViewStyle,
    handleScroll,
    scrollToIndex
  };
}

function normalizePositiveNumber(value: MaybeRefOrGetter<number | undefined>) {
  const numericValue = Number(toValue(value));
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}