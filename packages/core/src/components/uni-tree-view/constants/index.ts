import type { TreeProps } from "../types";

export const CHECK_STATUS_MAP = {
  checked: "checked", // 选中
  unchecked: "unchecked", // 未选中
  indeterminate: "indeterminate" // 半选
} as const;

export const DefaultTreeProps: TreeProps = {
  id: "id",
  label: "label",
  children: "children",
  disabled: "disabled",
  leaf: "leaf",
  append: "append",
  icon: "icon"
};