# uni-tree-view

适用于 uni-app + Vue 3 的树形列表选择组件，支持展开收起、单选/多选、父子联动、禁用节点、`v-model` 和自定义字段名。

## Development

```bash
pnpm install
pnpm play
pnpm test
pnpm build
```

`pnpm play` 会启动 `playground` 的 H5 调试页。

## Usage

```vue
<template>
  <uni-tree-view
    v-model="checkedValue"
    multiple
    show-checkbox
    :data="treeData"
    filter-value="展厅"
    :default-expanded-keys="['building-a']"
    expand-checked
    @change="handleChange"
    @expand-change="handleExpandChange"
  />
</template>

<script setup lang="ts">
import UniTreeView from "uni-tree-view";
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
| `data` | `TreeDataItem[]` | `[]` | 树形数据 |
| `v-model` | `string \| number \| Array<string \| number> \| null` | `null` | 当前选中值 |
| `filterValue` | `string` | `''` | 过滤关键词，命中节点、祖先和后代会保持可见 |
| `treeProps` | `Partial<TreeProps>` | `{ id: 'id', label: 'label', children: 'children', disabled: 'disabled', leaf: 'leaf', append: 'append', icon: 'icon' }` | 自定义字段名 |
| `field` | `TreeLegacyField \| null` | `null` | 兼容旧字段映射，支持 `key/value/label/children/disabled/leaf/append/icon` |
| `labelField` | `string` | `label` | 兼容式标签字段 |
| `valueField` | `string` | `id` | 兼容式值字段 |
| `childrenField` | `string` | `children` | 兼容式下级字段 |
| `disabledField` | `string` | `disabled` | 兼容式禁用字段 |
| `leafField` | `string` | `leaf` | 兼容式叶子字段 |
| `appendField` | `string` | `append` | 兼容式附加内容字段 |
| `iconField` | `string` | `icon` | 兼容式图标字段 |
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
| `cacheExpandedKeys` | `boolean` | `false` | 数据刷新时是否保留运行时展开状态 |
| `loadMode` | `boolean` | `false` | 是否启用懒加载；非叶子节点可在无 children 时展开 |
| `loadApi` | `(node) => TreeDataItem[] \| Promise<TreeDataItem[]>` | `undefined` | 懒加载函数，首次展开未加载节点时调用 |
| `isLeafFn` | `(item, node) => boolean` | `undefined` | 自定义叶子节点判断 |
| `alwaysFirstLoad` | `boolean` | `false` | 即使节点已有静态 children，也在首次展开时加载一次 |
| `checkedDisabled` | `boolean` | `false` | 是否允许用户或方法操作禁用节点 |
| `packDisabledkey` | `boolean` | `true` | 已选禁用节点是否出现在返回 keys/nodes 中 |
| `indent` | `number` | `40` | 层级缩进，单位 `rpx` |
| `checkboxPlacement` | `'left' \| 'right'` | `left` | 选择框位置 |
| `emptyText` | `string` | `暂无数据` | 空状态文本 |
| `showPath` | `boolean` | `false` | 是否在默认节点内容中显示路径 |
| `pathSeparator` | `string` | ` / ` | 默认路径展示分隔符 |
| `virtual` | `boolean` | `false` | 是否启用固定行高虚拟渲染，适合大量可见节点 |
| `virtualItemHeight` | `number` | `36` | 虚拟渲染单行高度，单位 `px` |
| `virtualHeight` | `number` | `400` | 虚拟渲染滚动容器高度，单位 `px` |
| `virtualOverscan` | `number` | `8` | 虚拟渲染视口上下额外渲染行数 |

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
| `load` | `{ node, children }` | 懒加载完成 |
| `node-click` | `{ id, node, path }` | 点击节点内容区域 |
| `filter-change` | `{ value, keys, nodes }` | 过滤关键词变化后的可见结果 |
| `updated` | `{ value, keys, nodes, node }` | 兼容旧的更新事件 |

## Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `default` | `{ node, data, path }` | 完整自定义节点内容 |
| `label` | `{ node, data, path }` | 自定义节点主标题 |
| `icon` | `{ node, data, path }` | 自定义节点图标 |
| `append` | `{ node, data, path }` | 自定义节点右侧附加内容 |

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
| `getVisibleKeys()` | 获取当前可见 key |
| `getExpandedNodes()` | 获取已展开节点 |
| `getUnexpandedNodes()` | 获取未展开节点 |
| `getVisibleNodes()` | 获取当前可见节点 |
| `getNode(key)` | 获取指定节点 |
| `getNodePath(keyOrNode)` | 获取指定节点路径 |
| `expandAll()` | 展开全部 |
| `collapseAll()` | 收起全部 |
| `loadNode(node)` | 手动加载指定节点 |

## Custom Display

```vue
<template>
  <uni-tree-view
    :data="treeData"
    show-path
    @node-click="handleNodeClick"
  >
    <template #icon="{ node }">
      <text>{{ node.icon }}</text>
    </template>
    <template #label="{ node }">
      <text>{{ node.label }}</text>
    </template>
    <template #append="{ node }">
      <text>{{ node.append }}</text>
    </template>
  </uni-tree-view>
</template>

<script setup>
const treeData = [
  { id: "building-a", label: "A 栋", icon: "楼", append: "12 间" }
];

function handleNodeClick(payload) {
  console.log(payload.id, payload.path.map((item) => item.label));
}
</script>
```

## Lazy Load

```vue
<template>
  <uni-tree-view
    load-mode
    :data="treeData"
    :load-api="loadChildren"
    @load="handleLoad"
  />
</template>

<script setup>
const treeData = [
  { id: "root", label: "根节点", leaf: false }
];

async function loadChildren(node) {
  return [
    { id: `${node.id}-child`, label: "异步子节点", leaf: true }
  ];
}

function handleLoad(payload) {
  console.log(payload.node, payload.children);
}
</script>
```

## Large Data

当树可能展开到数千或上万可见节点时，可以开启固定行高虚拟渲染。虚拟模式只渲染当前视口和少量缓冲节点，适合“中国-省-市-区/县-镇”这类层级数据；如果节点使用自定义 slot 且高度不固定，建议先保持普通渲染或统一节点高度。

```vue
<template>
  <uni-tree-view
    v-model="checkedKeys"
    show-checkbox
    virtual
    :virtual-height="560"
    :virtual-item-height="36"
    :data="districtTree"
  />
</template>
```

## Resolver

`UniTreeViewResolver` 是推荐名称；历史项目里的 `UniTreeListResolver` 和 `UniTreeList` 组件名仍保留兼容。

```ts
import UniComponents from "@uni-helper/vite-plugin-uni-components";
import { UniTreeViewResolver } from "uni-tree-view/resolver";

export default {
  plugins: [
    UniComponents({
      resolvers: [
        UniTreeViewResolver()
      ]
    })
  ]
};
```
