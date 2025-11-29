import type { TreeProps } from "../types";

export const CHECK_STATUS_MAP = {
  checked: "checked", // 选中
  unchecked: "unchecked", // 未选中
  indeterminate: "indeterminate" // 半选
};

export const defaultTreeProps: TreeProps = {
  id: "id",
  label: "label",
  children: "children",
  disabled: "disabled",
  class: "uni-tree-list-node"
};