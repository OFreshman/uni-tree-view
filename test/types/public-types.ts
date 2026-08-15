// 本文件中的公开类型断言在编译期校验，由 `pnpm check` 的类型检查执行。
import type {
  TreeCheckChangePayload,
  TreeEmptySlotProps,
  TreeModelValue,
  TreeSlotProps
} from "../../packages/core/src/components/uni-tree-view/types";
import type UniTreeView from "../../packages/core/src/components/uni-tree-view/uni-tree-view.vue.d";

type ComponentProps = InstanceType<typeof UniTreeView>["$props"];
type Slots = InstanceType<typeof UniTreeView>["$slots"];
type SlotName = keyof Slots;

type Assert<T extends true> = T;
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends
(<T>() => T extends B ? 1 : 2) ? true : false;

type _SlotNames = Assert<Equals<SlotName, "default" | "label" | "icon" | "append" | "empty" | "empty-filter">>;
type _DefaultSlotProps = Assert<Equals<
  Parameters<NonNullable<Slots["default"]>>[0],
  TreeSlotProps
>>;
type _NodeSlotProps = Assert<Equals<
  Parameters<NonNullable<Slots["label"]>>[0],
  TreeSlotProps
>>;
type _EmptySlotProps = Assert<Equals<
  Parameters<NonNullable<Slots["empty"]>>[0],
  TreeEmptySlotProps
>>;
type _EmptyFilterSlotProps = Assert<Equals<
  Parameters<NonNullable<Slots["empty-filter"]>>[0],
  TreeEmptySlotProps
>>;
type _CheckChangePayload = Assert<Equals<
  Parameters<NonNullable<ComponentProps["onCheck-change"]>>,
  [payload: TreeCheckChangePayload]
>>;
type _UpdateModelValuePayload = Assert<Equals<
  Parameters<NonNullable<ComponentProps["onUpdate:modelValue"]>>,
  [value: TreeModelValue]
>>;

// @ts-expect-error unknown slot names must not be accepted by the public component type
const invalidSlotName: SlotName = "nonexistent-slot";
void invalidSlotName;