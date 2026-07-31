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
