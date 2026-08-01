# Events

| 事件 | 回调参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(value: TreeModelValue)` | 选中值变化（配合 `v-model`） |
| `check-change` | `(payload: TreeCheckChangePayload)` | 选中状态变化 |
| `expand-change` | `(payload: TreeExpandPayload)` | 节点展开/收起 |
| `node-click` | `(payload: TreeNodeClickPayload)` | 点击节点行 |
| `load` | `(payload: TreeLoadPayload)` | 懒加载成功 |
| `load-error` | `(payload: TreeLoadErrorPayload)` | 懒加载失败 |
| `filter-change` | `(payload: TreeFilterPayload)` | 过滤结果变化 |

## Payload 结构

### TreeCheckChangePayload

```ts
interface TreeCheckChangePayload {
  value: TreeModelValue; // 新的 v-model 值
  keys: TreeKey[];       // 当前全部选中 keys
  nodes: TreeNode[];     // 当前全部选中节点
  node: TreeNode;        // 本次触发变化的节点
}
```

### TreeExpandPayload

```ts
interface TreeExpandPayload {
  expanded: boolean; // 变化后的展开状态：true 展开，false 收起
  node: TreeNode;    // 本次展开/收起的节点
}
```

### TreeNodeClickPayload

```ts
interface TreeNodeClickPayload {
  id: TreeKey;      // 被点击节点的 key
  node: TreeNode;   // 被点击的节点
  path: TreeNode[]; // 根到该节点的路径（含自身）
}
```

### TreeLoadPayload / TreeLoadErrorPayload

```ts
interface TreeLoadPayload {
  node: TreeNode;           // 完成加载的节点
  children: TreeDataItem[]; // load-api 本次返回的子节点数据
}

interface TreeLoadErrorPayload {
  node: TreeNode; // 加载失败的节点，停留在失败态可重试
  error: unknown; // load-api 抛出/reject 的错误
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
