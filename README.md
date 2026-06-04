# uni-tree-list

适用于 uni-app + Vue 3 的树形列表选择组件，支持展开收起、单选/多选、禁用节点和自定义字段名。

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
    :data="treeData"
    :default-expanded-ids="['building-a']"
    @checked="handleChecked"
    @go-child="handleGoChild"
  />
</template>

<script setup lang="ts">
import UniTreeList from "uni-tree-list";
import { ref } from "vue";

const checkedValue = ref<Array<string | number>>([]);
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

function handleChecked(payload) {
  console.log(payload.value, payload.node);
}

function handleGoChild(payload) {
  console.log(payload.id, payload.node);
}
</script>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `TreeNode[]` | `[]` | 树形数据 |
| `v-model` | `string \| number \| Array<string \| number> \| null` | `null` | 当前选中值 |
| `treeProps` | `Partial<TreeProps>` | `{}` | 自定义 `id`、`label`、`children`、`disabled` 字段名 |
| `multiple` | `boolean` | `false` | 是否多选 |
| `defaultExpandedIds` | `Array<string \| number>` | `[]` | 默认展开的节点 ID |
| `indent` | `number` | `32` | 层级缩进，单位 `rpx` |
| `emptyText` | `string` | `暂无数据` | 空状态文本 |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | 当前值 | v-model 更新 |
| `checked` | `{ value, node }` | 节点选中状态变化 |
| `goChild` | `{ id, node }` | 点击子级入口 |
| `updated` | `{ value, node }` | 兼容旧的更新事件 |

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
