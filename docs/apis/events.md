# Events

| 事件 | 回调参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(value: TreeModelValue)` | 选中值变化（配合 `v-model`） |
| `change` | `(payload: TreeChangePayload)` | 选中状态变化 |
| `check-change` | `(payload: TreeChangePayload)` | 同 `change`，Element Plus 风格别名 |
| `expand` | `(expanded: boolean, node: TreeNode)` | 节点展开/收起 |
| `expand-change` | `(payload: TreeExpandPayload)` | 同 `expand`，对象参数形式 |
| `node-click` | `(payload: TreeNodeClickPayload)` | 点击节点行 |
| `load` | `(payload: TreeLoadPayload)` | 懒加载成功 |
| `load-error` | `(payload: TreeLoadErrorPayload)` | 懒加载失败 |
| `filter-change` | `(payload: TreeFilterPayload)` | 过滤结果变化 |

::: details 兼容别名（不推荐新项目使用）
`checked` / `updated`（同 `change`）、`goChild`（展开子级）为历史兼容事件，行为与主事件一致。
:::

## Payload 结构

### TreeChangePayload

```ts
interface TreeChangePayload {
  value: TreeModelValue; // 新的 v-model 值
  keys: TreeKey[];       // 当前全部选中 keys
  nodes: TreeNode[];     // 当前全部选中节点
  node: TreeNode;        // 本次触发变化的节点
}
```

### TreeExpandPayload

```ts
interface TreeExpandPayload {
  expanded: boolean;
  node: TreeNode;
}
```

### TreeNodeClickPayload

```ts
interface TreeNodeClickPayload {
  id: TreeKey;
  node: TreeNode;
  path: TreeNode[]; // 根到该节点的路径
}
```

### TreeLoadPayload / TreeLoadErrorPayload

```ts
interface TreeLoadPayload {
  node: TreeNode;
  children: TreeDataItem[];
}

interface TreeLoadErrorPayload {
  node: TreeNode;
  error: unknown;
}
```

### TreeFilterPayload

```ts
interface TreeFilterPayload {
  value: string;      // 当前关键词
  keys: TreeKey[];    // 过滤后可见 keys
  nodes: TreeNode[];  // 过滤后可见节点
}
```
