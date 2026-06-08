/* eslint-disable ts/no-empty-object-type */
import type { DefineComponent } from "vue";
import type { AllowedComponentProps } from "../../types";
import type { UniTreeListEmits, UniTreeListExposed, UniTreeListProps } from "./types";

type UniTreeList = DefineComponent<
  AllowedComponentProps & UniTreeListProps,
  UniTreeListExposed,
  {},
  {},
  {},
  {},
  {},
  UniTreeListEmits
>;

declare const _default: UniTreeList;

export default _default;