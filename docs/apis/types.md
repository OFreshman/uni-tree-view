# 类型定义

`uni-tree-view/shared` 是共享入口：除公开类型外，也保留 `device`、`env`、`helpers`、`mitt` 和 `uni` 运行时工具导出。组件本身不依赖这些工具；使用者可按需导入。

包内所有公开类型均可从该入口导入：

```ts
import type {
  TreeCheckChangePayload,
  TreeDataItem,
  TreeKey,
  TreeNode,
  UniTreeViewProps
} from "uni-tree-view/shared";
```

## 基础类型

```ts
// 节点唯一标识
type TreeKey = string | number;

// v-model 值：单选为单个 key（未选中为 null），多选为 key 数组
type TreeModelValue = TreeKey | TreeKey[] | null;

// 选中状态：indeterminate 为半选（部分子节点选中）
type CheckStatus = "checked" | "unchecked" | "indeterminate";

// 原始数据项，任意结构；字段名可通过 tree-props 映射
interface TreeDataItem {
  [key: string]: any;
}
```

## TreeNode

组件内部的节点对象，在事件 payload 和插槽作用域中提供：

```ts
interface TreeNode {
  id: TreeKey;             // 节点唯一标识，取自数据的 id 字段（可由 tree-props 映射）
  label: string;           // 节点文本
  append: string;          // 尾部附加文本，数据中无该字段时为空字符串
  icon: string;            // 图标字段值，数据中无该字段时为空字符串
  path: string[];          // 根到该节点的 label 路径
  source: TreeDataItem;    // 原始数据项
  parentId?: TreeKey;      // 直接父节点 key，根节点为 undefined
  parentIds: TreeKey[];    // 根到父节点的 key 链（从根开始，不含自身）
  parents: TreeDataItem[]; // 根到父节点的原始数据链（顺序同 parentIds）
  level: number;           // 层级，根为 0
  disabled: boolean;       // 是否禁用；默认不参与选中状态变更
  checked: CheckStatus;    // 选中状态，含半选 indeterminate
  expanded: boolean;       // 是否已展开
  visible: boolean;        // 过滤后是否可见
  isLeaf: boolean;         // 是否叶子节点
  loaded: boolean;         // 懒加载是否完成
  loading: boolean;        // 懒加载进行中
  loadError: unknown | null; // 最近一次加载失败的错误，未失败或重试成功后为 null
}
```

## 全局组件类型

在 `tsconfig.json` 中注册后，模板中的 `<uni-tree-view>` 获得完整类型提示：

```json
{
  "compilerOptions": {
    "types": ["uni-tree-view/global"]
  }
}
```
