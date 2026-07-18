# 类型定义

包内所有公开类型均可从 `uni-tree-view/shared` 导入：

```ts
import type {
  TreeChangePayload,
  TreeDataItem,
  TreeKey,
  TreeNode,
  UniTreeListProps
} from "uni-tree-view/shared";
```

## 基础类型

```ts
type TreeKey = string | number;

type TreeModelValue = TreeKey | TreeKey[] | null;

type CheckStatus = "checked" | "unchecked" | "indeterminate";

interface TreeDataItem {
  [key: string]: any;
}
```

## TreeNode

组件内部的节点对象，在事件 payload 和插槽作用域中提供：

```ts
interface TreeNode {
  id: TreeKey;
  label: string;
  append: string;
  icon: string;
  path: string[];          // 根到该节点的 label 路径
  source: TreeDataItem;    // 原始数据项
  parentId?: TreeKey;
  parentIds: TreeKey[];
  parents: TreeDataItem[];
  level: number;           // 层级，根为 0
  disabled: boolean;
  checked: CheckStatus;
  expanded: boolean;
  visible: boolean;        // 过滤后是否可见
  isLeaf: boolean;
  loaded: boolean;         // 懒加载是否完成
  loading: boolean;        // 懒加载进行中
  loadError: unknown | null;
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
