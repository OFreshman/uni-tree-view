import type { CHECK_STATUS_MAP } from "./constants/index";

export type TreeKey = string | number;

export type CheckStatus = typeof CHECK_STATUS_MAP[keyof typeof CHECK_STATUS_MAP];

export type TreeModelValue = TreeKey | TreeKey[] | null;

export interface TreeDataItem {
  [key: string]: any;
}

export interface TreeNode {
  id: TreeKey;
  label: string;
  source: TreeDataItem;
  parentId?: TreeKey;
  parentIds: TreeKey[];
  parents: TreeDataItem[];
  level: number;
  disabled: boolean;
  checked: CheckStatus;
  expanded: boolean;
  visible: boolean;
  isLeaf: boolean;
}

export interface TreeProps {
  id: string;
  label: string;
  children: string;
  disabled?: string;
  class?: string;
}

export interface TreeChangePayload {
  value: TreeModelValue;
  keys: TreeKey[];
  nodes: TreeNode[];
  node: TreeNode;
}

export interface TreeExpandPayload {
  expanded: boolean;
  node: TreeNode;
}

export interface UniTreeListProps {
  /** Current selected value. Single select uses one key, multiple select uses an array. */
  modelValue?: TreeModelValue;
  /** Tree data. */
  data: TreeDataItem[];
  /** Default checked keys for uncontrolled initial state. */
  defaultCheckedKeys?: TreeKey | TreeKey[];
  /** Field mapping for id, label, children and disabled. */
  treeProps?: Partial<TreeProps>;
  /** Theme color for active checkbox/radio. */
  themeColor?: string;
  /** Whether to show checkbox UI. */
  showCheckbox?: boolean;
  /** Whether to show radio UI in single-select mode. */
  showRadioIcon?: boolean;
  /** Whether to support multiple selection. */
  multiple?: boolean;
  /** Whether parent and child checked states are independent. */
  checkStrictly?: boolean;
  /** Single-select mode can only select leaf nodes. */
  onlyRadioLeaf?: boolean;
  /** Whether all nodes are expanded initially. */
  defaultExpandAll?: boolean;
  /** Default expanded node keys. */
  defaultExpandedKeys?: TreeKey[];
  /** Alias for defaultExpandedKeys, kept for README compatibility. */
  defaultExpandedIds?: TreeKey[];
  /** Expand ancestors of checked nodes initially. */
  expandChecked?: boolean;
  /** Tree item indent in rpx. */
  indent?: number;
  /** Checkbox/radio placement. */
  checkboxPlacement?: "left" | "right";
  /** Empty text shown when data is empty. */
  emptyText?: string;
}

export interface UniTreeListExposed {
  setCheckedKeys: (keys: TreeKey | TreeKey[], checked?: boolean) => void;
  getCheckedKeys: () => TreeKey[];
  getHalfCheckedKeys: () => TreeKey[];
  getUncheckedKeys: () => TreeKey[];
  getCheckedNodes: () => TreeNode[];
  getHalfCheckedNodes: () => TreeNode[];
  getUncheckedNodes: () => TreeNode[];
  setExpandedKeys: (keys: TreeKey[] | "all", expanded?: boolean) => void;
  getExpandedKeys: () => TreeKey[];
  getUnexpandedKeys: () => TreeKey[];
  getExpandedNodes: () => TreeNode[];
  getUnexpandedNodes: () => TreeNode[];
  expandAll: () => void;
  collapseAll: () => void;
}

export interface UniTreeListEmits {
  "update:modelValue": (value: TreeModelValue) => void;
  change: (payload: TreeChangePayload) => void;
  checked: (payload: TreeChangePayload) => void;
  updated: (payload: TreeChangePayload) => void;
  "check-change": (payload: TreeChangePayload) => void;
  expand: (expanded: boolean, node: TreeNode) => void;
  "expand-change": (payload: TreeExpandPayload) => void;
  goChild: (params: { id: TreeKey; node: TreeNode }) => void;
}