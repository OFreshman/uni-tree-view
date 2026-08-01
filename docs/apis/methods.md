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
  const selectableKeys = treeRef.value
    .getVisibleNodes()
    .filter((node) => !node.disabled)
    .map((node) => node.id);

  treeRef.value.setCheckedKeys(selectableKeys, true);
}
</script>
```

## 选中

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setCheckedKeys` | `(keys: TreeKey \| TreeKey[], checked = true) => void` | 设置指定 keys 的选中状态；默认跳过禁用节点 |
| `getCheckedKeys` | `() => TreeKey[]` | 获取全部选中 keys |
| `getHalfCheckedKeys` | `() => TreeKey[]` | 获取半选 keys |
| `getUncheckedKeys` | `() => TreeKey[]` | 获取未选 keys |
| `getCheckedNodes` | `() => TreeNode[]` | 获取全部选中节点 |
| `getHalfCheckedNodes` | `() => TreeNode[]` | 获取半选节点 |
| `getUncheckedNodes` | `() => TreeNode[]` | 获取未选节点 |

`checked-disabled` 默认为 `false`，此时禁用节点的当前选中状态会被锁定：通过 `setCheckedKeys` 实现的全选、清空，以及父子联动和受控值回放都不会改变它。只有显式开启 `checked-disabled`，禁用节点才允许参与状态变更。

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

> 懒加载模式下，`setExpandedKeys`、`expandAll` 和 `collapseAll` 只处理当前已经进入状态树的节点，不会自动调用 `load-api` 加载未知后代。需要加载时请先调用 `loadNode` / `retryLoad`，或由用户展开节点触发加载。

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
| `scrollToKey` | `(key, options?: { expandParents? }) => Promise<boolean>` | 滚动到指定节点（虚拟与普通模式均可用），`expandParents` 默认 `true`，先展开已加载的祖先链后定位 |

`scrollToKey` 只能定位当前已经进入状态树的节点；目标 key 尚未通过懒加载创建时返回 `false`，且不会为了查找目标而自动加载后代。
