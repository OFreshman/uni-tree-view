/* eslint-disable ts/no-empty-object-type */
import type { DefineComponent } from "vue";
import type { AllowedComponentProps } from "../../types";
import type { UniTreeViewEmits, UniTreeViewExposed, UniTreeViewProps } from "./types";

/**
 * `DefineComponent` 的 E 参数要求 `EmitsOptions`（函数值）形态，
 * 这里从 `UniTreeViewEmits` 的元组形态映射而来。
 */
type UniTreeViewEmitsOptions = {
  [K in keyof UniTreeViewEmits]: (...args: UniTreeViewEmits[K]) => any;
};

type UniTreeViewComponent = DefineComponent<
  AllowedComponentProps & UniTreeViewProps,
  UniTreeViewExposed,
  {},
  {},
  {},
  {},
  {},
  UniTreeViewEmitsOptions
>;

declare const _default: UniTreeViewComponent;

export default _default;