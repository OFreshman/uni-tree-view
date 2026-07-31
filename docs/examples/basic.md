---
demo: basic
demoTitle: 基础用法
outline: false
pageClass: examples-page
---

# 基础用法

## 纯展示树

不传 `selectable` 时为纯展示树，点击箭头展开收起：

```vue
<template>
  <uni-tree-view :data="treeData" />
</template>

<script setup>
const treeData = [
  {
    id: "building-a",
    label: "A 栋",
    children: [
      {
        id: "floor-a-1",
        label: "1 层",
        children: [
          { id: "room-a-101", label: "101 会议室" },
          { id: "room-a-102", label: "102 办公区" }
        ]
      },
      { id: "floor-a-2", label: "2 层" }
    ]
  },
  { id: "building-b", label: "B 栋" }
];
</script>
```

## 默认展开

```vue
<!-- 展开全部 -->
<uni-tree-view :data="treeData" default-expand-all />

<!-- 展开指定节点 -->
<uni-tree-view :data="treeData" :default-expanded-keys="['building-a']" />
```

## 禁用节点

数据中的 `disabled: true` 节点不可选中，样式置灰：

```js
{ id: "room-a-202", label: "202 设备间", disabled: true }
```

## 整行交互

默认只有箭头/选择控件可点。移动端希望整行可点时：

```vue
<uni-tree-view
  :data="treeData"
  selectable
  multiple
  check-on-click-node
  expand-on-click-node
/>
```

## 自定义节点样式

普通 `class` 设置组件根容器；`node-class` 设置每个节点行的外部类名：

```vue
<uni-tree-view
  class="department-tree"
  node-class="department-tree-node"
  :data="treeData"
/>

<style scoped>
:deep(.department-tree-node) {
  min-height: 44px;
}
</style>
```

`node-class` 是外部样式入口，不需要依赖组件内部类名。

## 节点路径

```vue
<uni-tree-view :data="treeData" show-path path-separator=" > " />
```
