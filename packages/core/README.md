# uni-tree-view

适用于 uni-app + Vue 3 的树形列表选择组件，支持展开收起、单选/多选、父子联动、禁用节点、`v-model` 和自定义字段名。

## Development

```bash
pnpm install
pnpm play
pnpm build
```

`pnpm play` 会启动 `playground` 的 H5 调试页。

## Usage

```vue
<template>
  <uni-tree-list
    v-model="checkedValue"
    multiple
    show-checkbox
    :data="treeData"
    :default-expanded-keys="['building-a']"
    expand-checked
    @change="handleChange"
    @expand-change="handleExpandChange"
  />
</template>

<script setup lang="ts">
import UniTreeList from "uni-tree-list";
import { ref } from "vue";

const checkedValue = ref<Array<string | number>>(["floor-a-2"]);
const treeData = [
  {
    id: "building-a",
    label: "A 栋",
    children: [
      { id: "floor-a-1", label: "1 层" },
      { id: "floor-a-2", label: "2 层", disabled: true }
    ]
  }
];

function handleChange(payload) {
  console.log(payload.value, payload.keys, payload.nodes, payload.node);
}

function handleExpandChange(payload) {
  console.log(payload.expanded, payload.node);
}
</script>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `TreeNode[]` | `[]` | 树形数据 |
| `v-model` | `string \| number \| Array<string \| number> \| null` | `null` | 当前选中值 |
| `treeProps` | `Partial<TreeProps>` | `{ id: 'id', label: 'label', children: 'children', disabled: 'disabled' }` | 自定义字段名 |
| `themeColor` | `string` | `#007aff` | 主题色 |
| `showCheckbox` | `boolean` | `false` | 是否显示多选框；开启后进入多选模式 |
| `showRadioIcon` | `boolean` | `true` | 单选模式是否显示 radio 图标 |
| `multiple` | `boolean` | `false` | 是否多选 |
| `checkStrictly` | `boolean` | `false` | 多选时父子节点是否不联动 |
| `onlyRadioLeaf` | `boolean` | `false` | 单选时是否只允许选中叶子节点 |
| `defaultCheckedKeys` | `string \| number \| Array<string \| number>` | `[]` | 非受控默认选中值 |
| `defaultExpandAll` | `boolean` | `false` | 是否默认展开所有节点 |
| `defaultExpandedKeys` | `Array<string \| number>` | `[]` | 默认展开的节点 key |
| `defaultExpandedIds` | `Array<string \| number>` | `[]` | `defaultExpandedKeys` 的兼容别名 |
| `expandChecked` | `boolean` | `false` | 是否自动展开已选节点的父级 |
| `indent` | `number` | `40` | 层级缩进，单位 `rpx` |
| `checkboxPlacement` | `'left' \| 'right'` | `left` | 选择框位置 |
| `emptyText` | `string` | `暂无数据` | 空状态文本 |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | 当前值 | v-model 更新 |
| `change` | `{ value, keys, nodes, node }` | 节点选中状态变化 |
| `check-change` | `{ value, keys, nodes, node }` | 节点选中状态变化 |
| `checked` | `{ value, keys, nodes, node }` | 兼容旧的选中事件 |
| `goChild` | `{ id, node }` | 点击子级入口 |
| `expand` | `(expanded, node)` | 节点展开状态变化 |
| `expand-change` | `{ expanded, node }` | 节点展开状态变化 |
| `updated` | `{ value, keys, nodes, node }` | 兼容旧的更新事件 |

## Methods

通过组件 `ref` 可调用：

| Method | Description |
| --- | --- |
| `setCheckedKeys(keys, checked?)` | 设置节点选中/取消选中 |
| `getCheckedKeys()` | 获取已选 key |
| `getHalfCheckedKeys()` | 获取半选 key |
| `getUncheckedKeys()` | 获取未选 key |
| `getCheckedNodes()` | 获取已选节点 |
| `getHalfCheckedNodes()` | 获取半选节点 |
| `getUncheckedNodes()` | 获取未选节点 |
| `setExpandedKeys(keys, expanded?)` | 设置节点展开/收起，`keys` 可传 `'all'` |
| `getExpandedKeys()` | 获取已展开 key |
| `getUnexpandedKeys()` | 获取未展开 key |
| `getExpandedNodes()` | 获取已展开节点 |
| `getUnexpandedNodes()` | 获取未展开节点 |
| `expandAll()` | 展开全部 |
| `collapseAll()` | 收起全部 |

## Resolver

```ts
import UniComponents from "@uni-helper/vite-plugin-uni-components";
import { UniTreeListResolver } from "uni-tree-list/resolver";

export default {
  plugins: [
    UniComponents({
      resolvers: [
        UniTreeListResolver()
      ]
    })
  ]
};
```
