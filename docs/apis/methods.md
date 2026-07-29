# Methods

通过 ref 调用组件实例方法：

```vue
<template>
  <uni-tree-view ref="treeRef" :data="treeData" selectable multiple />
</template>

<script setup>
import { ref } from "vue";

const treeRef = ref();

function selectAll() {
  treeRef.value.setCheckedKeys(
    treeRef.value.getVisibleKeys(),
    true
  );
}
</script>
```

## 选中

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setCheckedKeys` | `(keys: TreeKey \| TreeKey[], checked = true) => void` | 设置指定 keys 的选中状态 |
| `getCheckedKeys` | `() => TreeKey[]` | 获取全部选中 keys |
| `getHalfCheckedKeys` | `() => TreeKey[]` | 获取半选 keys |
| `getUncheckedKeys` | `() => TreeKey[]` | 获取未选 keys |
| `getCheckedNodes` | `() => TreeNode[]` | 获取全部选中节点 |
| `getHalfCheckedNodes` | `() => TreeNode[]` | 获取半选节点 |
| `getUncheckedNodes` | `() => TreeNode[]` | 获取未选节点 |

## 展开

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setExpandedKeys` | `(keys: TreeKey[] \| "all", expanded = true) => void` | 设置展开状态，`"all"` 作用于全部 |
| `expandAll` | `() => void` | 展开全部 |
| `collapseAll` | `() => void` | 收起全部 |
| `getExpandedKeys` | `() => TreeKey[]` | 获取已展开 keys |
| `getUnexpandedKeys` | `() => TreeKey[]` | 获取未展开 keys |
| `getExpandedNodes` | `() => TreeNode[]` | 获取已展开节点 |
| `getUnexpandedNodes` | `() => TreeNode[]` | 获取未展开节点 |

## 查询

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getNode` | `(key: TreeKey) => TreeNode \| undefined` | 按 key 查找节点 |
| `getNodePath` | `(keyOrNode) => TreeNode[]` | 获取根到节点的路径 |
| `getVisibleKeys` | `() => TreeKey[]` | 当前可见（含过滤后）keys |
| `getVisibleNodes` | `() => TreeNode[]` | 当前可见节点 |

## 懒加载 / 滚动

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `loadNode` | `(node: TreeNode) => Promise<TreeDataItem[]>` | 手动触发节点加载 |
| `retryLoad` | `(keyOrNode) => Promise<TreeDataItem[]>` | 重试加载失败的节点 |
| `scrollToKey` | `(key, options?: { expandParents? }) => Promise<boolean>` | 滚动到指定节点（虚拟模式），`expandParents` 先展开祖先链 |
