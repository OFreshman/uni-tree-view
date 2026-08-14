/* eslint-disable ts/no-empty-object-type */
import type { DefineComponent, PublicProps, SlotsType } from "vue";
import type { AllowedComponentProps } from "../../types";
import type {
  UniTreeViewEmits,
  UniTreeViewExposed,
  UniTreeViewProps,
  UniTreeViewSlots
} from "./types";

export type * from "./types";

/**
 * `DefineComponent` 的 E 参数要求 `EmitsOptions`（函数值）形态，
 * 这里从 `UniTreeViewEmits` 的元组形态映射而来。
 */
type UniTreeViewEmitsOptions = {
  [K in keyof UniTreeViewEmits]: (...args: UniTreeViewEmits[K]) => any;
};

/**
 * Vue 的 `ResolveProps` 未导出，按同等语义复刻：原始 props 只读化并透传事件属性，
 * 事件参数直接取自 `UniTreeViewEmits` 的具名元组以保留 payload 类型。
 */
type UniTreeViewEmitsToProps = {
  [K in keyof UniTreeViewEmits as `on${Capitalize<string & K>}`]?: (...args: UniTreeViewEmits[K]) => any;
};

type UniTreeViewComponent = DefineComponent<
  AllowedComponentProps & UniTreeViewProps,
  UniTreeViewExposed,
  {},
  {},
  {},
  {},
  {},
  UniTreeViewEmitsOptions,
  string,
  PublicProps,
  Readonly<AllowedComponentProps & UniTreeViewProps> & UniTreeViewEmitsToProps,
  {},
  SlotsType<UniTreeViewSlots>
>;

declare const _default: UniTreeViewComponent;

export default _default;