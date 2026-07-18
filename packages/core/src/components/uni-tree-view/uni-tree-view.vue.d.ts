/* eslint-disable ts/no-empty-object-type */
import type { DefineComponent } from "vue";
import type { AllowedComponentProps } from "../../types";
import type { UniTreeListEmits, UniTreeListExposed, UniTreeListProps } from "./types";

/**
 * `DefineComponent` 的 E 参数要求 `EmitsOptions`（函数值）形态，
 * 这里从 `UniTreeListEmits` 的元组形态映射而来。
 */
type UniTreeListEmitsOptions = {
  [K in keyof UniTreeListEmits]: (...args: UniTreeListEmits[K]) => any;
};

type UniTreeList = DefineComponent<
  AllowedComponentProps & UniTreeListProps,
  UniTreeListExposed,
  {},
  {},
  {},
  {},
  {},
  UniTreeListEmitsOptions
>;

declare const _default: UniTreeList;

export default _default;