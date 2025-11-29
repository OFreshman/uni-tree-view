import type { CHECK_STATUS_MAP } from "./constants/index";

export type CheckStatus = typeof CHECK_STATUS_MAP[keyof typeof CHECK_STATUS_MAP]; // 选中状态

export interface TreeNode {
  id: string | number;
  pid?: string | number;
  label?: string;
  check?: CheckStatus;
  disabled: boolean;
  children?: TreeNode[];
  expanded?: boolean; // 是否展开（非叶子节点有效）
  visible?: boolean; // 自身是否显示, 默认仅展示第一级
  [key: string]: any;
}

export interface TreeProps {
  id: string; // 每个节点的唯一标识
  label: string;
  children: string;
  disabled?: string;
  class?: string;
}

export interface UniTreeListProps {
  // 树数据 树级结构
  data: Array<TreeNode>;
  // 默认选中的节点key数组
  defaultCheckedKeys?: string[];
  // 树节点的属性配置
  treeProps?: TreeProps;
  // 默认是否展开所有节点
  defaultExpandAll?: boolean;
  // 是否节点选中
  showCheckbox?: boolean;
  // 是否支持多选
  multiple?: boolean;
  // 是否严格遵循父子关系选中状态
  checkStrictly?: boolean;
  // 是否自动展开父节点(默认展开时)
  autoExpandParent?: boolean;
}

// export interface UniTreeProps {
//   // 树节点的属性配置
//   treeProps?: TreeProps;
//   // 是否支持悬着
//   selectable?: boolean;
//   // 默认选中的节点id列表
//   defaultCheckedIdList?: string[];
// }

type MouseEventName =
  | "click"
  | "dblclick"
  | "mouseout"
  | "mouseover"
  | "mouseup"
  | "mousedown"
  | "mousemove"
  | "contextmenu"
  | "globalout";

type ElementEventName =
  | MouseEventName
  | "mousewheel"
  | "drag"
  | "dragstart"
  | "dragend"
  | "dragenter"
  | "dragleave"
  | "dragover"
  | "drop";

type UniEventName =
  | "touchstart"
  | "touchmove"
  | "touchcancel"
  | "touchend"
  | "tap"
  | "longpress"
  | "longtap"
  | "transitionend"
  | "animationstart"
  | "animationiteration"
  | "animationend"
  | "touchforcechange";

type NativeEventName = `native:${ElementEventName}` | `native:${UniEventName}`;

type OtherEventName =
  | "checked"
  | "goChild";

type MouseEmits = {
  [key in MouseEventName]: (params: any) => void;
};

type OtherEmits = {
  [key in OtherEventName]: (params: any) => void;
};

type NativeEmits = {
  [key in NativeEventName]: (params: any) => void;
};

export type UniTreeListEmits = MouseEmits & OtherEmits & NativeEmits & {
  updated: (params: any) => void;
};